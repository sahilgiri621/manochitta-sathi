from django.db import transaction
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.profiles.models import UserProfile

from .models import EmailVerificationToken, PasswordResetToken, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "phone", "first_name", "last_name", "role", "is_email_verified")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    age = serializers.IntegerField(write_only=True, required=False, allow_null=True, min_value=1, max_value=120)
    gender = serializers.ChoiceField(write_only=True, required=False, allow_blank=True, choices=UserProfile.GENDER_CHOICES)
    wellbeing_goals = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bio = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("email", "phone", "first_name", "last_name", "password", "role", "age", "gender", "wellbeing_goals", "bio")

    def validate_role(self, value):
        if value == User.ROLE_ADMIN:
            raise serializers.ValidationError("Admin accounts cannot be self-registered.")
        return value

    def validate_phone(self, value):
        if value in ("", None):
            return None
        return value

    def validate(self, attrs):
        role = attrs.get("role", User.ROLE_USER)
        if role == User.ROLE_USER and attrs.get("age") in (None, ""):
            raise serializers.ValidationError({"age": "Age is required."})
        if role == User.ROLE_USER and not attrs.get("gender"):
            raise serializers.ValidationError({"gender": "Gender is required."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        profile_data = {
            "age": validated_data.pop("age", None),
            "gender": validated_data.pop("gender", ""),
            "wellbeing_goals": validated_data.pop("wellbeing_goals", ""),
            "bio": validated_data.pop("bio", ""),
        }
        with transaction.atomic():
            user = User.objects.create_user(**validated_data, password=password)
            user.is_email_verified = True
            if user.role == User.ROLE_ADMIN:
                user.is_staff = True
                user.save(update_fields=["is_email_verified", "is_staff"])
            else:
                user.save(update_fields=["is_email_verified"])
            UserProfile.objects.filter(user=user).update(**profile_data)
        return user


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        try:
            token = EmailVerificationToken.objects.select_related("user").get(token=value)
        except EmailVerificationToken.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid verification token.") from exc
        if not token.is_valid():
            raise serializers.ValidationError("Verification token is expired or already used.")
        self.instance = token
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_token(self, value):
        try:
            token = PasswordResetToken.objects.select_related("user").get(token=value)
        except PasswordResetToken.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid reset token.") from exc
        if not token.is_valid():
            raise serializers.ValidationError("Reset token is expired or already used.")
        self.instance = token
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token

    def validate(self, attrs):
        credentials = {
            "email": attrs.get("email"),
            "password": attrs.get("password"),
        }
        user = authenticate(request=self.context.get("request"), **credentials)
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class ProfileSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("age", "gender", "wellbeing_goals", "bio", "address", "emergency_contact_name", "emergency_contact_phone")


class AdminUserManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_email_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "email", "created_at", "updated_at")

    def validate_role(self, value):
        if self.instance and self.instance.is_superuser and value != User.ROLE_ADMIN:
            raise serializers.ValidationError("Superusers must keep the admin role.")
        return value
