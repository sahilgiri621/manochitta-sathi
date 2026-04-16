from rest_framework import serializers


class AIConversationMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=("user", "assistant"))
    content = serializers.CharField(max_length=2000)


class AIChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    conversation_context = AIConversationMessageSerializer(many=True, required=False)
    user_context = serializers.DictField(required=False)

    def validate_message(self, value):
        message = value.strip()
        if not message:
            raise serializers.ValidationError("Message cannot be empty.")
        return message
