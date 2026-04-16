from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Notification(TimeStampedModel):
    TYPE_APPOINTMENT = "appointment"
    TYPE_APPROVAL = "approval"
    TYPE_GENERAL = "general"
    TYPE_CHOICES = (
        (TYPE_APPOINTMENT, "Appointment"),
        (TYPE_APPROVAL, "Approval"),
        (TYPE_GENERAL, "General"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_GENERAL)
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "is_read"]),
        ]
