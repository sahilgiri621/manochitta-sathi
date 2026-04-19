from apps.communications.models import Conversation
from apps.notifications.models import Notification
from apps.therapists.models import TherapistAvailability

from .models import Appointment, AppointmentEvent


def create_appointment_event(appointment, actor, status, note=""):
    return AppointmentEvent.objects.create(appointment=appointment, actor=actor, status=status, note=note)


def ensure_appointment_conversation(appointment):
    if appointment is None or appointment.user_id is None or appointment.therapist_id is None:
        return None
    conversation, _ = Conversation.objects.get_or_create(
        appointment=appointment,
        defaults={
            "user": appointment.user,
            "therapist": appointment.therapist,
            "is_active": True,
        },
    )
    return conversation


def release_slot_if_no_active_booking(slot):
    if slot is None:
        return
    has_active_booking = slot.appointments.filter(status__in=slot_blocking_statuses()).exists()
    if not has_active_booking and not slot.is_available:
        slot.is_available = True
        slot.save(update_fields=["is_available", "updated_at"])


def slot_blocking_statuses():
    return (
        Appointment.STATUS_CONFIRMED,
        Appointment.STATUS_ACCEPTED,
        Appointment.STATUS_RESCHEDULED,
    )


def expire_past_availability_slots():
    from django.utils import timezone

    TherapistAvailability.objects.filter(is_available=True, end_time__lte=timezone.now()).update(
        is_available=False,
        updated_at=timezone.now(),
    )


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
