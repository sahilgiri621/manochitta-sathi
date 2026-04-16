from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class SupportTicket(TimeStampedModel):
    ISSUE_TYPE_PAYMENT = "payment"
    ISSUE_TYPE_REFUND = "refund"
    ISSUE_TYPE_APPOINTMENT = "appointment"
    ISSUE_TYPE_TECHNICAL = "technical"
    ISSUE_TYPE_CHOICES = (
        (ISSUE_TYPE_PAYMENT, "Payment"),
        (ISSUE_TYPE_REFUND, "Refund"),
        (ISSUE_TYPE_APPOINTMENT, "Appointment"),
        (ISSUE_TYPE_TECHNICAL, "Technical"),
    )

    STATUS_OPEN = "open"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_RESOLVED = "resolved"
    STATUS_CHOICES = (
        (STATUS_OPEN, "Open"),
        (STATUS_IN_PROGRESS, "In progress"),
        (STATUS_RESOLVED, "Resolved"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_tickets")
    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_tickets",
    )
    subject = models.CharField(max_length=255)
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES)
    description = models.TextField()
    payment_reference = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)

    class Meta:
        ordering = ("-updated_at", "-id")
        indexes = [
            models.Index(fields=["user", "status"], name="support_sup_user_id_d98abc_idx"),
            models.Index(fields=["issue_type", "status"], name="support_sup_issue_t_1d659f_idx"),
        ]

    def save(self, *args, **kwargs):
        if self.payment_reference == "":
            self.payment_reference = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"SupportTicket<{self.subject}>"


class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_messages")
    message = models.TextField()
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        indexes = [
            models.Index(fields=["ticket", "created_at"], name="support_sup_ticket__87916d_idx"),
        ]

    def __str__(self):
        return f"SupportMessage<{self.ticket_id}:{self.sender_id}>"
