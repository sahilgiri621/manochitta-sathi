from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender", "sender_name", "content", "is_read", "created_at")
        read_only_fields = ("sender",)


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    therapist_name = serializers.CharField(source="therapist.user.full_name", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Conversation
        fields = ("id", "appointment", "user", "user_name", "therapist", "therapist_name", "is_active", "messages", "created_at")
        read_only_fields = ("user",)
