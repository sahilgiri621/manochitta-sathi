from rest_framework import serializers

from .models import UserProfile


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
