from rest_framework import serializers

from .models import PackagePlan, UserSubscription


class PackagePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagePlan
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "session_credits",
            "duration_days",
            "price_amount",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = PackagePlanSerializer(read_only=True)

    class Meta:
        model = UserSubscription
        fields = (
            "id",
            "plan",
            "status",
            "total_credits",
            "remaining_credits",
            "starts_at",
            "expires_at",
            "activated_at",
            "cancelled_at",
            "payment_status",
            "payment_provider",
            "paid_amount",
            "khalti_pidx",
            "payment_transaction_id",
            "payment_initiated_at",
            "payment_verified_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
