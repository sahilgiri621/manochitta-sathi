from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "id",
            "age",
            "gender",
            "wellbeing_goals",
            "bio",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "created_at",
            "updated_at",
        )

    def validate_age(self, value):
        if value is None:
            return value
        if value < 1 or value > 120:
            raise serializers.ValidationError("Age must be between 1 and 120.")
        return value


class AssignedPatientProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="full_name", read_only=True)
    wellbeing_goals = serializers.CharField(source="profile.wellbeing_goals", read_only=True)
    bio = serializers.CharField(source="profile.bio", read_only=True)
    address = serializers.CharField(source="profile.address", read_only=True)
    age = serializers.IntegerField(source="profile.age", read_only=True)
    gender = serializers.CharField(source="profile.gender", read_only=True)
    emergency_contact_name = serializers.CharField(source="profile.emergency_contact_name", read_only=True)
    emergency_contact_phone = serializers.CharField(source="profile.emergency_contact_phone", read_only=True)
    appointment_count = serializers.IntegerField(read_only=True)
    last_appointment_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "age",
            "gender",
            "wellbeing_goals",
            "bio",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "appointment_count",
            "last_appointment_at",
        )
