from django.contrib.auth import get_user_model

from apps.notifications.models import Notification

from .models import SupportTicket

User = get_user_model()


def notify_admins_new_ticket(ticket: SupportTicket):
    admins = User.objects.filter(role="admin", is_active=True)
    notifications = [
        Notification(
            user=admin,
            title="New support ticket",
            message=f"{ticket.user.full_name or ticket.user.email} submitted: {ticket.subject}",
            notification_type=Notification.TYPE_GENERAL,
            metadata={
                "ticket_id": ticket.id,
                "issue_type": ticket.issue_type,
                "status": ticket.status,
            },
        )
        for admin in admins
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


def notify_admins_ticket_reply(ticket: SupportTicket):
    admins = User.objects.filter(role="admin", is_active=True)
    notifications = [
        Notification(
            user=admin,
            title="Support ticket updated",
            message=f"{ticket.user.full_name or ticket.user.email} added a message to '{ticket.subject}'.",
            notification_type=Notification.TYPE_GENERAL,
            metadata={
                "ticket_id": ticket.id,
                "issue_type": ticket.issue_type,
                "status": ticket.status,
            },
        )
        for admin in admins
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


def notify_ticket_owner_reply(ticket: SupportTicket, *, replied_by_admin: bool):
    if not replied_by_admin:
        return
    Notification.objects.create(
        user=ticket.user,
        title="Support replied",
        message=f"Our support team replied to '{ticket.subject}'.",
        notification_type=Notification.TYPE_GENERAL,
        metadata={
            "ticket_id": ticket.id,
            "status": ticket.status,
        },
    )


def notify_ticket_owner_status_change(ticket: SupportTicket):
    Notification.objects.create(
        user=ticket.user,
        title="Support ticket updated",
        message=f"Your support ticket '{ticket.subject}' is now {ticket.status.replace('_', ' ')}.",
        notification_type=Notification.TYPE_GENERAL,
        metadata={
            "ticket_id": ticket.id,
            "status": ticket.status,
        },
    )
