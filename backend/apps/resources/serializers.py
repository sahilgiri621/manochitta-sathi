from rest_framework import serializers

from .models import Category, Resource


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "created_at", "updated_at")
        read_only_fields = ("slug",)


class ResourceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = Resource
        fields = (
            "id",
            "title",
            "slug",
            "category",
            "category_name",
            "summary",
            "content",
            "format",
            "published",
            "created_by",
            "created_by_name",
            "created_by_email",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("slug", "created_by", "created_by_name", "created_by_email")
