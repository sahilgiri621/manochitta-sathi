from rest_framework import permissions

from apps.common.date_filters import filter_queryset_by_date
from apps.common.viewsets import WrappedModelViewSet

from .models import MoodEntry
from .serializers import MoodEntrySerializer


class MoodEntryViewSet(WrappedModelViewSet):
    serializer_class = MoodEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ("entry_date", "created_at")

    def get_queryset(self):
        queryset = MoodEntry.objects.filter(user=self.request.user)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        queryset = filter_queryset_by_date(queryset, "entry_date", self.request.query_params.get("date"), is_datetime=False)
        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
