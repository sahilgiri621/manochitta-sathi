from rest_framework import permissions

from apps.common.date_filters import filter_queryset_by_date
from apps.common.permissions import IsUserRole
from apps.common.viewsets import WrappedModelViewSet

from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackViewSet(WrappedModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]
    search_fields = ("comment", "user__first_name", "user__last_name", "therapist__user__first_name", "therapist__user__last_name")
    ordering_fields = ("created_at", "rating")

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsUserRole()]
        if self.action == "list":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Feedback.objects.prefetch_related("appointment", "user", "therapist__user").order_by("-created_at", "-id")
        queryset = filter_queryset_by_date(queryset, "created_at", self.request.query_params.get("date"))
        therapist_id = self.request.query_params.get("therapist_id")
        if therapist_id:
            queryset = queryset.filter(therapist_id=therapist_id)

        user = self.request.user
        if not user.is_authenticated:
            return queryset if therapist_id else queryset.none()
        if user.role == "admin":
            return queryset
        if user.role == "therapist":
            return queryset.filter(therapist__user=user)
        return queryset.filter(user=user)
