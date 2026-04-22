from django.contrib import admin

from .models import Category, Resource


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at", "updated_at")
    search_fields = ("name", "description", "slug")
    readonly_fields = ("slug", "created_at", "updated_at")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "format", "published", "created_by", "updated_at")
    list_filter = ("published", "format", "category")
    search_fields = ("title", "summary", "content", "slug", "created_by__email")
    readonly_fields = ("slug", "created_at", "updated_at")
    raw_id_fields = ("created_by",)
