from django.db import transaction
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.profiles.models import UserProfile

from .commission import get_next_commission_rule
from .models import TherapistAvailability, TherapistClinic, TherapistCommissionRule, TherapistProfile


class TherapistAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TherapistAvailability
        fields = ("id", "start_time", "end_time", "is_available", "created_at", "updated_at")
        read_only_fields = ("is_available",)

    def validate(self, attrs):
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")
        if start_time and start_time <= timezone.now():
            raise serializers.ValidationError("Availability slot must be in the future.")
        therapist = getattr(self.instance, "therapist", None)
        if therapist is None:
            request = self.context.get("request")
            therapist = getattr(getattr(request, "user", None), "therapist_profile", None)
        overlapping = TherapistAvailability.objects.filter(
            therapist=therapist,
            start_time__lt=end_time,
            end_time__gt=start_time,
        )
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)
        if overlapping.exists():
            raise serializers.ValidationError("This slot overlaps with an existing availability slot.")
        if self.instance and self.instance.appointments.exclude(
            status__in=[Appointment.STATUS_CANCELLED, Appointment.STATUS_REJECTED]
        ).exists():
            raise serializers.ValidationError("Booked availability slots cannot be edited.")
        return attrs


class TherapistClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = TherapistClinic
        fields = (
            "id",
            "clinic_name",
            "clinic_address",
            "latitude",
            "longitude",
            "phone",
            "opening_hours",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value


class TherapistProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile_image_url = serializers.SerializerMethodField(read_only=True)
    age = serializers.IntegerField(source="user.profile.age", required=False, allow_null=True)
    gender = serializers.ChoiceField(source="user.profile.gender", required=False, allow_blank=True, choices=UserProfile.GENDER_CHOICES)
    clinic = TherapistClinicSerializer(read_only=True)
    rating = serializers.SerializerMethodField(read_only=True)
    review_count = serializers.SerializerMethodField(read_only=True)
    next_tier_name = serializers.SerializerMethodField(read_only=True)
    next_tier_min_sessions = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TherapistProfile
        fields = (
            "id",
            "user",
            "age",
            "gender",
            "specialization",
            "bio",
            "qualifications",
            "experience_years",
            "license_number",
            "approval_status",
            "consultation_fee",
            "completed_sessions",
            "commission_rate",
            "commission_tier",
            "total_earnings",
            "next_tier_name",
            "next_tier_min_sessions",
            "languages",
            "profile_image",
            "profile_image_url",
            "rating",
            "review_count",
            "clinic",
            "approved_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "approval_status",
            "approved_at",
            "completed_sessions",
            "commission_rate",
            "commission_tier",
            "total_earnings",
            "next_tier_name",
            "next_tier_min_sessions",
        )

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return ""
        request = self.context.get("request")
        url = obj.profile_image.url
        return request.build_absolute_uri(url) if request else url

    def _get_feedback_summary(self, obj):
        if hasattr(obj, "_feedback_summary_cache"):
            return obj._feedback_summary_cache
        summary = obj.feedback_entries.aggregate(
            average_rating=Avg("rating"),
            total_reviews=Count("id"),
        )
        obj._feedback_summary_cache = summary
        return summary

    def get_rating(self, obj):
        summary = self._get_feedback_summary(obj)
        return float(summary.get("average_rating") or 0.0)

    def get_review_count(self, obj):
        summary = self._get_feedback_summary(obj)
        return int(summary.get("total_reviews") or 0)

    def _can_view_commission(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return user.role == "admin" or obj.user_id == user.id

    def _get_next_rule(self, obj):
        if not self._can_view_commission(obj):
            return None
        if hasattr(obj, "_next_commission_rule_cache"):
            return obj._next_commission_rule_cache
        obj._next_commission_rule_cache = get_next_commission_rule(obj)
        return obj._next_commission_rule_cache

    def get_next_tier_name(self, obj):
        rule = self._get_next_rule(obj)
        return rule.tier_name if rule else ""

    def get_next_tier_min_sessions(self, obj):
        rule = self._get_next_rule(obj)
        return rule.min_sessions if rule else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not self._can_view_commission(instance):
            for field in (
                "completed_sessions",
                "commission_rate",
                "commission_tier",
                "total_earnings",
                "next_tier_name",
                "next_tier_min_sessions",
            ):
                data.pop(field, None)
        return data

    def validate_profile_image(self, value):
        if not value:
            return value
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Profile image must be 5 MB or smaller.")
        content_type = getattr(value, "content_type", "")
        if content_type and not content_type.startswith("image/"):
            raise serializers.ValidationError("Uploaded file must be an image.")
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("user", {}).get("profile", {})
        with transaction.atomic():
            if profile_data:
                UserProfile.objects.filter(user=instance.user).update(**profile_data)
                instance.user.profile.refresh_from_db()
            update_fields = []
            for field, value in validated_data.items():
                setattr(instance, field, value)
                update_fields.append(field)
            if update_fields:
                instance.save(update_fields=[*update_fields, "updated_at"])
            return instance


class TherapistApplicationSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, min_length=8)
    age = serializers.IntegerField(min_value=1, max_value=120)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES)
    specialization = serializers.CharField(max_length=255)
    bio = serializers.CharField(required=False, allow_blank=True)
    qualifications = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(min_value=0, required=False, default=0)
    license_number = serializers.CharField(max_length=100)
    consultation_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    languages = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        if value in ("", None):
            return None
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return value

    def validate_profile_image(self, value):
        return TherapistProfileSerializer(context=self.context).validate_profile_image(value)

    def create(self, validated_data):
        password = validated_data.pop("password")
        profile_data = {
            "age": validated_data.pop("age"),
            "gender": validated_data.pop("gender"),
        }
        therapist_data = {
            "specialization": validated_data.pop("specialization"),
            "license_number": validated_data.pop("license_number"),
        }
        for optional_field in ("bio", "qualifications", "experience_years", "consultation_fee", "languages"):
            value = validated_data.pop(optional_field, None)
            if value not in ("", None):
                therapist_data[optional_field] = value
        profile_image = validated_data.pop("profile_image", None)

        with transaction.atomic():
            user = User.objects.create_user(role=User.ROLE_THERAPIST, password=password, **validated_data)
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])
            UserProfile.objects.filter(user=user).update(**profile_data)
            therapist_profile = TherapistProfile.objects.select_for_update().get(user=user)
            if profile_image is not None:
                therapist_data["profile_image"] = profile_image
            for field, value in therapist_data.items():
                setattr(therapist_profile, field, value)
            therapist_profile.save(update_fields=[*therapist_data.keys(), "updated_at"])
        return therapist_profile


class TherapistApprovalSerializer(serializers.Serializer):
    approval_status = serializers.ChoiceField(choices=TherapistProfile.APPROVAL_CHOICES)

    def validate_approval_status(self, value):
        if value == TherapistProfile.STATUS_PENDING:
            raise serializers.ValidationError("Pending is not a valid approval action.")
        return value


class TherapistCommissionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TherapistCommissionRule
        fields = (
            "id",
            "tier_name",
            "min_sessions",
            "max_sessions",
            "commission_rate",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        min_sessions = attrs.get("min_sessions", getattr(self.instance, "min_sessions", 0))
        max_sessions = attrs.get("max_sessions", getattr(self.instance, "max_sessions", None))
        if max_sessions is not None and max_sessions < min_sessions:
            raise serializers.ValidationError("Maximum sessions must be greater than or equal to minimum sessions.")
        return attrs
