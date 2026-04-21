from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Appointment(TimeStampedModel):
    MEETING_PROVIDER_GOOGLE_MEET = "google_meet"
    MEETING_PROVIDER_CHOICES = (
        (MEETING_PROVIDER_GOOGLE_MEET, "Google Meet"),
    )

    MEETING_STATUS_PENDING = "pending"
    MEETING_STATUS_READY = "ready"
    MEETING_STATUS_FAILED = "failed"
    MEETING_STATUS_CHOICES = (
        (MEETING_STATUS_PENDING, "Pending"),
        (MEETING_STATUS_READY, "Ready"),
        (MEETING_STATUS_FAILED, "Failed"),
    )

    TYPE_CHAT = "chat"
    TYPE_AUDIO = "audio"
    TYPE_VIDEO = "video"
    TYPE_FACE = "face_to_face"
    SESSION_TYPE_CHOICES = (
        (TYPE_CHAT, "Chat"),
        (TYPE_AUDIO, "Audio"),
        (TYPE_VIDEO, "Video"),
        (TYPE_FACE, "Face to face"),
    )

    STATUS_PENDING_PAYMENT = "pending_payment"
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"
    STATUS_MISSED = "missed"
    STATUS_RESCHEDULED = "rescheduled"
    STATUS_CHOICES = (
        (STATUS_PENDING_PAYMENT, "Pending payment"),
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_MISSED, "Missed"),
        (STATUS_RESCHEDULED, "Rescheduled"),
    )

    PAYMENT_UNPAID = "unpaid"
    PAYMENT_PENDING = "pending"
    PAYMENT_PAID = "paid"
    PAYMENT_FAILED = "failed"
    PAYMENT_CANCELLED = "cancelled"
    PAYMENT_EXPIRED = "expired"
    PAYMENT_REFUNDED = "refunded"
    PAYMENT_STATUS_CHOICES = (
        (PAYMENT_UNPAID, "Unpaid"),
        (PAYMENT_PENDING, "Pending"),
        (PAYMENT_PAID, "Paid"),
        (PAYMENT_FAILED, "Failed"),
        (PAYMENT_CANCELLED, "Cancelled"),
        (PAYMENT_EXPIRED, "Expired"),
        (PAYMENT_REFUNDED, "Refunded"),
    )

    BOOKING_PAYMENT_TYPE_SINGLE = "single"
    BOOKING_PAYMENT_TYPE_PACKAGE = "package"
    BOOKING_PAYMENT_TYPE_CHOICES = (
        (BOOKING_PAYMENT_TYPE_SINGLE, "Single"),
        (BOOKING_PAYMENT_TYPE_PACKAGE, "Package"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="appointments")
    therapist = models.ForeignKey("therapists.TherapistProfile", on_delete=models.CASCADE, related_name="appointments")
    availability_slot = models.ForeignKey(
        "therapists.TherapistAvailability",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    therapist_response_note = models.TextField(blank=True)
    rescheduled_from = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="reschedules")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_UNPAID)
    booking_payment_type = models.CharField(
        max_length=20,
        choices=BOOKING_PAYMENT_TYPE_CHOICES,
        default=BOOKING_PAYMENT_TYPE_SINGLE,
    )
    subscription = models.ForeignKey(
        "packages.UserSubscription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    subscription_credit_consumed_at = models.DateTimeField(null=True, blank=True)
    subscription_credit_restored_at = models.DateTimeField(null=True, blank=True)
    payment_provider = models.CharField(max_length=30, blank=True)
    paid_amount = models.PositiveIntegerField(default=0)
    khalti_pidx = models.CharField(max_length=255, blank=True)
    payment_transaction_id = models.CharField(max_length=255, blank=True)
    payment_initiated_at = models.DateTimeField(null=True, blank=True)
    payment_verified_at = models.DateTimeField(null=True, blank=True)
    meeting_provider = models.CharField(max_length=30, choices=MEETING_PROVIDER_CHOICES, blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)
    external_calendar_event_id = models.CharField(max_length=255, blank=True, null=True)
    meeting_status = models.CharField(max_length=20, choices=MEETING_STATUS_CHOICES, blank=True, null=True)
    meeting_created_at = models.DateTimeField(null=True, blank=True)
    session_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_rate_used = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    therapist_earning = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tier_used = models.CharField(max_length=100, blank=True, null=True)

    ACTIVE_STATUSES = (STATUS_CONFIRMED, STATUS_ACCEPTED, STATUS_RESCHEDULED)
    TERMINAL_STATUSES = (STATUS_CANCELLED, STATUS_REJECTED, STATUS_COMPLETED, STATUS_MISSED)

    class Meta:
        ordering = ("-scheduled_start",)
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["scheduled_start"]),
            models.Index(fields=["user", "status"]),
            models.Index(fields=["therapist", "status"]),
            models.Index(fields=["payment_status"]),
            models.Index(fields=["booking_payment_type"]),
            models.Index(fields=["khalti_pidx"]),
            models.Index(fields=["meeting_status"], name="appointmen_meeting_5c0f34_idx"),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(scheduled_end__gt=models.F("scheduled_start")), name="appointment_end_after_start"),
        ]

    def save(self, *args, **kwargs):
        # Oracle raises ORA-01401 on insert when several optional string fields
        # are sent as empty strings together. Normalize them to NULL instead.
        for field_name in (
            "cancellation_reason",
            "therapist_response_note",
            "payment_provider",
            "khalti_pidx",
            "payment_transaction_id",
            "meeting_provider",
            "meeting_link",
            "external_calendar_event_id",
            "meeting_status",
            "tier_used",
        ):
            if getattr(self, field_name, None) == "":
                setattr(self, field_name, None)
        super().save(*args, **kwargs)


class AppointmentEvent(TimeStampedModel):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointment_events")
    status = models.CharField(max_length=20, choices=Appointment.STATUS_CHOICES)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ("created_at",)
