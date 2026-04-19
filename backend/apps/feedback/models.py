from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Feedback(TimeStampedModel):
    appointment = models.OneToOneField("appointments.Appointment", on_delete=models.CASCADE, related_name="feedback")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_entries")
    therapist = models.ForeignKey("therapists.TherapistProfile", on_delete=models.CASCADE, related_name="feedback_entries")
    rating = models.PositiveSmallIntegerField()
    service_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    comment = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["therapist", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(rating__gte=1) & models.Q(rating__lte=5), name="feedback_rating_range"),
            models.CheckConstraint(
                check=models.Q(service_rating__isnull=True) | (models.Q(service_rating__gte=1) & models.Q(service_rating__lte=5)),
                name="feedback_service_rating_range",
            ),
        ]
