from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender", "sender_name", "content", "is_read", "created_at")
        read_only_fields = ("sender",)

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()

    def validate_conversation(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This conversation is closed.")
        return value


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    therapist_name = serializers.CharField(source="therapist.user.full_name", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Conversation
        fields = ("id", "appointment", "user", "user_name", "therapist", "therapist_name", "is_active", "messages", "created_at")
        read_only_fields = ("user",)

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        appointment = attrs.get("appointment")
        therapist = attrs.get("therapist")
        if appointment is None or therapist is None:
            raise serializers.ValidationError("A booked appointment is required to start a conversation.")
        if user is None or user.role != "user":
            raise serializers.ValidationError("Only users may create conversations for appointment booking.")
        if appointment.user_id != user.id:
            raise serializers.ValidationError("You can only create a conversation for your own appointment.")
        if therapist.id != appointment.therapist_id:
            raise serializers.ValidationError("The conversation therapist must match the appointment therapist.")
        return attrs

    def create(self, validated_data):
        conversation, _ = Conversation.objects.get_or_create(
            appointment=validated_data["appointment"],
            defaults={
                "user": validated_data["user"],
                "therapist": validated_data["therapist"],
                "is_active": True,
            },
        )
        return conversation
