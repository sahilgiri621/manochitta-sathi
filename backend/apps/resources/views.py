from rest_framework import permissions

from apps.common.permissions import IsAdminOrReadOnly, IsAdminOrTherapistOwnerOrReadOnly
from apps.common.viewsets import WrappedModelViewSet

from .models import Category, Resource
from .serializers import CategorySerializer, ResourceSerializer


class CategoryViewSet(WrappedModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Category.objects.all()
    search_fields = ("name", "description")
    ordering_fields = ("name", "created_at")


class ResourceViewSet(WrappedModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [IsAdminOrTherapistOwnerOrReadOnly]
    search_fields = ("title", "summary", "content")
    ordering_fields = ("title", "created_at")

    def get_queryset(self):
        queryset = Resource.objects.prefetch_related("category", "created_by")
        category = self.request.query_params.get("category")
        format_value = self.request.query_params.get("format")
        user = self.request.user
        if user.is_authenticated and user.role == "admin":
            pass
        elif user.is_authenticated and user.role == "therapist":
            queryset = queryset.filter(created_by=user)
        else:
            queryset = queryset.filter(published=True)
        if category:
            queryset = queryset.filter(category__slug=category)
        if format_value:
            queryset = queryset.filter(format=format_value)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
