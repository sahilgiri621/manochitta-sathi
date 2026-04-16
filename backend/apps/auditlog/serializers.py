from rest_framework import serializers

from .models import AdminAction


class AdminActionSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source="admin.full_name", read_only=True)

    class Meta:
        model = AdminAction
        fields = ("id", "admin", "admin_name", "action", "target_type", "target_id", "details", "created_at")
