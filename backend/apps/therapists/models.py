from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models

from apps.common.models import TimeStampedModel


def therapist_profile_image_upload_to(instance, filename):
    return f"therapists/{instance.user_id}/{filename}"


class TherapistProfile(TimeStampedModel):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    APPROVAL_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="therapist_profile")
    specialization = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    qualifications = models.TextField(blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    license_number = models.CharField(max_length=100, blank=True)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default=STATUS_PENDING)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_therapists",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    languages = models.CharField(max_length=255, blank=True)
    profile_image = models.ImageField(
        upload_to=therapist_profile_image_upload_to,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])],
    )

    class Meta:
        indexes = [
            models.Index(fields=["approval_status"]),
            models.Index(fields=["specialization"]),
        ]

    def __str__(self):
        return f"Therapist<{self.user.email}>"


class TherapistClinic(TimeStampedModel):
    therapist = models.OneToOneField(TherapistProfile, on_delete=models.CASCADE, related_name="clinic")
    clinic_name = models.CharField(max_length=255)
    clinic_address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    phone = models.CharField(max_length=30, blank=True)
    opening_hours = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["clinic_name"]),
            models.Index(fields=["latitude", "longitude"]),
        ]

    def __str__(self):
        return f"Clinic<{self.clinic_name}>"


class TherapistAvailability(TimeStampedModel):
    therapist = models.ForeignKey(TherapistProfile, on_delete=models.CASCADE, related_name="availability_slots")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ("start_time",)
        indexes = [
            models.Index(fields=["start_time", "end_time"]),
            models.Index(fields=["is_available"]),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(end_time__gt=models.F("start_time")), name="availability_end_after_start"),
        ]

    def __str__(self):
        return f"{self.therapist.user.email}: {self.start_time}"
