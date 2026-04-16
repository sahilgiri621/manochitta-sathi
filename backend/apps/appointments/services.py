from apps.notifications.models import Notification

from .models import AppointmentEvent


def create_appointment_event(appointment, actor, status, note=""):
    return AppointmentEvent.objects.create(appointment=appointment, actor=actor, status=status, note=note)


def notify_appointment_users(appointment, title, message):
    Notification.objects.create(
        user=appointment.user,
        title=title,
        message=message,
        notification_type=Notification.TYPE_APPOINTMENT,
        metadata={"appointment_id": appointment.id},
    )
    Notification.objects.create(
        user=appointment.therapist.user,
        title=title,
        message=message,
        notification_type=Notification.TYPE_APPOINTMENT,
        metadata={"appointment_id": appointment.id},
    )
