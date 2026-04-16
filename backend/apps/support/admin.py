from django.contrib import admin

from .models import SupportMessage, SupportTicket


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    readonly_fields = ("sender", "is_admin", "message", "created_at")
    can_delete = False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "issue_type", "status", "user", "appointment", "updated_at")
    list_filter = ("issue_type", "status")
    search_fields = ("subject", "description", "payment_reference", "user__email")
    readonly_fields = ("created_at", "updated_at")
    inlines = [SupportMessageInline]


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "sender", "is_admin", "created_at")
    list_filter = ("is_admin",)
    search_fields = ("ticket__subject", "sender__email", "message")
    readonly_fields = ("created_at",)

