from django.db import transaction
from rest_framework import serializers

from .models import SupportMessage, SupportTicket


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = SupportMessage
        fields = ("id", "ticket", "sender", "sender_name", "message", "is_admin", "created_at")
        read_only_fields = ("sender", "is_admin", "created_at", "ticket")

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()


class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    messages = SupportMessageSerializer(many=True, read_only=True)
    latest_message = serializers.SerializerMethodField(read_only=True)
    latest_message_at = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id",
            "user",
            "user_name",
            "appointment",
            "subject",
            "issue_type",
            "description",
            "payment_reference",
            "status",
            "latest_message",
            "latest_message_at",
            "messages",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user", "status")

    def _get_latest_message(self, obj):
        messages = getattr(obj, "_prefetched_objects_cache", {}).get("messages")
        if messages is not None:
            messages = list(messages)
            return messages[-1] if messages else None
        return obj.messages.order_by("-created_at", "-id").first()

    def get_latest_message(self, obj):
        latest = self._get_latest_message(obj)
        return latest.message if latest else ""

    def get_latest_message_at(self, obj):
        latest = self._get_latest_message(obj)
        return latest.created_at if latest else None

    def validate_subject(self, value):
        if not value.strip():
            raise serializers.ValidationError("Subject cannot be empty.")
        return value.strip()

    def validate_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Description cannot be empty.")
        return value.strip()

    def validate(self, attrs):
        request = self.context["request"]
        appointment = attrs.get("appointment", getattr(self.instance, "appointment", None))
        issue_type = attrs.get("issue_type", getattr(self.instance, "issue_type", None))
        payment_reference = attrs.get("payment_reference", getattr(self.instance, "payment_reference", None))

        if appointment and request.user.role != "admin" and appointment.user_id != request.user.id:
            raise serializers.ValidationError({"appointment": "You can only attach your own appointment."})

        if issue_type == SupportTicket.ISSUE_TYPE_REFUND and not appointment and not payment_reference:
            raise serializers.ValidationError(
                {"payment_reference": "Refund requests should include an appointment or payment reference when available."}
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        with transaction.atomic():
            ticket = SupportTicket.objects.create(user=request.user, **validated_data)
            SupportMessage.objects.create(
                ticket=ticket,
                sender=request.user,
                message=ticket.description,
                is_admin=False,
            )
        return ticket


class SupportTicketStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ("id", "status", "updated_at")
        read_only_fields = ("id", "updated_at")

    def validate_status(self, value):
        if value not in dict(SupportTicket.STATUS_CHOICES):
            raise serializers.ValidationError("Invalid ticket status.")
        return value
