from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

from apps.common.viewsets import WrappedModelViewSet

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(WrappedModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ("created_at",)

    def get_queryset(self):
        queryset = Conversation.objects.prefetch_related("user", "therapist__user", "appointment", "messages__sender")
        user = self.request.user
        if user.role == "admin":
            return queryset
        if user.role == "therapist":
            return queryset.filter(therapist__user=user)
        return queryset.filter(user=user)

    def perform_create(self, serializer):
        if self.request.user.role != "user":
            raise PermissionDenied("Only users can start conversations directly.")
        serializer.save(user=self.request.user)


class MessageViewSet(WrappedModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ("created_at",)

    def get_queryset(self):
        queryset = Message.objects.prefetch_related("conversation", "sender", "conversation__therapist__user")
        user = self.request.user
        if user.role == "admin":
            return queryset
        if user.role == "therapist":
            return queryset.filter(conversation__therapist__user=user)
        return queryset.filter(conversation__user=user)

    def perform_create(self, serializer):
        conversation = serializer.validated_data["conversation"]
        if self.request.user.role != "admin" and self.request.user.id not in (conversation.user_id, conversation.therapist.user_id):
            raise PermissionDenied("You are not part of this conversation.")
        serializer.save(sender=self.request.user)
