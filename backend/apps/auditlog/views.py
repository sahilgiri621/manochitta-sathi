from rest_framework import permissions

from apps.common.date_filters import filter_queryset_by_date
from apps.common.permissions import IsAdminRole
from apps.common.viewsets import WrappedReadOnlyModelViewSet

from .models import AdminAction
from .serializers import AdminActionSerializer


class AdminActionViewSet(WrappedReadOnlyModelViewSet):
    serializer_class = AdminActionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    search_fields = ("action", "target_type", "target_id", "admin__email", "admin__first_name", "admin__last_name")
    ordering_fields = ("created_at",)

    def get_queryset(self):
        queryset = AdminAction.objects.prefetch_related("admin").all()
        return filter_queryset_by_date(queryset, "created_at", self.request.query_params.get("date"))
