from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class PatientRecord(TimeStampedModel):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="patient_records")
    therapist = models.ForeignKey("therapists.TherapistProfile", on_delete=models.CASCADE, related_name="patient_records")
    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_records",
    )
    notes = models.TextField()
    diagnosis_notes = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    session_summary = models.TextField(blank=True)
    patient_progress = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)
    risk_flag = models.CharField(max_length=255, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-updated_at", "-created_at")
        indexes = [
            models.Index(fields=["patient", "created_at"]),
            models.Index(fields=["therapist", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        # Match the Oracle handling used by appointments: optional strings are
        # persisted as NULL instead of empty strings to avoid ORA-01401.
        for field_name in (
            "diagnosis_notes",
            "recommendations",
            "session_summary",
            "patient_progress",
            "next_steps",
            "risk_flag",
        ):
            if getattr(self, field_name, None) == "":
                setattr(self, field_name, None)
        super().save(*args, **kwargs)
