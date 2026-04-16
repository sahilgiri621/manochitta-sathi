from rest_framework import permissions
from rest_framework.decorators import action

from apps.common.date_filters import filter_queryset_by_date
from apps.common.responses import api_response
from apps.common.viewsets import WrappedModelViewSet

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(WrappedModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "post", "head", "options"]
    ordering_fields = ("created_at",)

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        return filter_queryset_by_date(queryset, "created_at", self.request.query_params.get("date"))

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
        return api_response(data=NotificationSerializer(notification).data, message="Notification marked as read.")
