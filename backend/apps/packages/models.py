from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class PackagePlan(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    session_credits = models.PositiveSmallIntegerField()
    duration_days = models.PositiveSmallIntegerField(default=30)
    price_amount = models.PositiveIntegerField(help_text="Plan price stored in paisa for Khalti.")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("price_amount", "id")
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class UserSubscription(TimeStampedModel):
    STATUS_PENDING_PAYMENT = "pending_payment"
    STATUS_ACTIVE = "active"
    STATUS_EXPIRED = "expired"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = (
        (STATUS_PENDING_PAYMENT, "Pending payment"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_CANCELLED, "Cancelled"),
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

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(PackagePlan, on_delete=models.CASCADE, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING_PAYMENT)
    total_credits = models.PositiveSmallIntegerField(default=0)
    remaining_credits = models.PositiveSmallIntegerField(default=0)
    starts_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_UNPAID)
    payment_provider = models.CharField(max_length=30, blank=True, null=True)
    paid_amount = models.PositiveIntegerField(default=0)
    khalti_pidx = models.CharField(max_length=255, blank=True, null=True)
    payment_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    payment_initiated_at = models.DateTimeField(null=True, blank=True)
    payment_verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["khalti_pidx"]),
        ]

    def save(self, *args, **kwargs):
        for field_name in ("payment_provider", "khalti_pidx", "payment_transaction_id"):
            if getattr(self, field_name, None) == "":
                setattr(self, field_name, None)
        super().save(*args, **kwargs)

    @property
    def is_active_now(self):
        return (
            self.status == self.STATUS_ACTIVE
            and self.payment_status == self.PAYMENT_PAID
            and self.remaining_credits > 0
            and (self.expires_at is None or self.expires_at > timezone.now())
        )
