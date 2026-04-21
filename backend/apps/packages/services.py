from dataclasses import dataclass
from datetime import timedelta

from django.db import models, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.appointments.models import Appointment
from apps.appointments.services import create_appointment_event, ensure_appointment_conversation, notify_appointment_users
from apps.notifications.models import Notification
from apps.payments.google_calendar_service import create_google_meet_event_for_appointment
from apps.therapists.models import TherapistAvailability, TherapistProfile

from .models import PackagePlan, UserSubscription


PACKAGE_PAYMENT_PROVIDER = "package"


@dataclass
class SubscriptionInitiationResult:
    subscription: UserSubscription
    amount: int


def expire_stale_subscriptions(user=None):
    queryset = UserSubscription.objects.filter(
        status=UserSubscription.STATUS_ACTIVE,
        expires_at__lte=timezone.now(),
    )
    if user is not None:
        queryset = queryset.filter(user=user)
    queryset.update(status=UserSubscription.STATUS_EXPIRED, updated_at=timezone.now())


def get_active_subscription_for_user(user, *, lock=False):
    expire_stale_subscriptions(user=user)
    queryset = UserSubscription.objects.filter(
        user=user,
        status=UserSubscription.STATUS_ACTIVE,
        payment_status=UserSubscription.PAYMENT_PAID,
        remaining_credits__gt=0,
    ).filter(models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=timezone.now()))
    if lock:
        queryset = queryset.select_for_update()
    queryset = queryset.select_related("plan").order_by("expires_at", "created_at", "id")
    return next(iter(queryset), None)


def create_pending_subscription_purchase(user, plan: PackagePlan) -> UserSubscription:
    expire_stale_subscriptions(user=user)
    return UserSubscription.objects.create(
        user=user,
        plan=plan,
        status=UserSubscription.STATUS_PENDING_PAYMENT,
        total_credits=plan.session_credits,
        remaining_credits=plan.session_credits,
        paid_amount=plan.price_amount,
    )


def activate_subscription_from_lookup(subscription: UserSubscription, lookup_data: dict) -> UserSubscription:
    normalized_status = str(lookup_data.get("status", "")).strip().lower()
    pidx = str(lookup_data.get("pidx") or subscription.khalti_pidx or "")
    transaction_id = str(lookup_data.get("transaction_id") or lookup_data.get("txn_id") or "")
    total_amount = int(lookup_data.get("total_amount") or lookup_data.get("amount") or subscription.plan.price_amount or 0)

    with transaction.atomic():
        subscription = UserSubscription.objects.select_for_update().select_related("plan", "user").get(pk=subscription.pk)
        was_already_active = (
            subscription.status == UserSubscription.STATUS_ACTIVE
            and subscription.payment_status == UserSubscription.PAYMENT_PAID
        )
        subscription.khalti_pidx = pidx
        subscription.payment_transaction_id = transaction_id
        subscription.paid_amount = total_amount

        if normalized_status in {"completed", "paid"}:
            now = timezone.now()
            subscription.status = UserSubscription.STATUS_ACTIVE
            subscription.payment_status = UserSubscription.PAYMENT_PAID
            subscription.payment_verified_at = subscription.payment_verified_at or now
            subscription.activated_at = subscription.activated_at or now
            subscription.starts_at = subscription.starts_at or now
            subscription.expires_at = subscription.expires_at or (now + timedelta(days=subscription.plan.duration_days))
            subscription.total_credits = subscription.total_credits or subscription.plan.session_credits
            if subscription.remaining_credits <= 0:
                subscription.remaining_credits = subscription.plan.session_credits
            if not was_already_active:
                Notification.objects.create(
                    user=subscription.user,
                    title="Package activated",
                    message=f"Your {subscription.plan.name} package is active with {subscription.remaining_credits} session credits.",
                    notification_type=Notification.TYPE_APPOINTMENT,
                    metadata={"subscription_id": subscription.id, "plan_id": subscription.plan_id},
                )
        elif normalized_status in {"pending", "initiated"}:
            subscription.status = UserSubscription.STATUS_PENDING_PAYMENT
            subscription.payment_status = UserSubscription.PAYMENT_PENDING
        elif normalized_status in {"user canceled", "cancelled"}:
            subscription.status = UserSubscription.STATUS_CANCELLED
            subscription.payment_status = UserSubscription.PAYMENT_CANCELLED
            subscription.cancelled_at = timezone.now()
        elif normalized_status == "expired":
            subscription.status = UserSubscription.STATUS_EXPIRED
            subscription.payment_status = UserSubscription.PAYMENT_EXPIRED
        elif normalized_status == "refunded":
            subscription.status = UserSubscription.STATUS_CANCELLED
            subscription.payment_status = UserSubscription.PAYMENT_REFUNDED
            subscription.cancelled_at = timezone.now()
        else:
            subscription.status = UserSubscription.STATUS_PENDING_PAYMENT
            subscription.payment_status = UserSubscription.PAYMENT_FAILED

        subscription.payment_provider = "khalti"
        subscription.save()

    return subscription


def attach_google_meet_for_package_appointment(appointment: Appointment):
    try:
        meeting_result = create_google_meet_event_for_appointment(appointment)
    except Exception:
        appointment.meeting_provider = Appointment.MEETING_PROVIDER_GOOGLE_MEET
        appointment.meeting_status = Appointment.MEETING_STATUS_FAILED
        appointment.save(update_fields=["meeting_provider", "meeting_status", "updated_at"])
        Notification.objects.create(
            user=appointment.user,
            title="Appointment confirmed",
            message="Your subscription booking is confirmed. The meeting link is still being prepared.",
            notification_type=Notification.TYPE_APPOINTMENT,
            metadata={"appointment_id": appointment.id},
        )
        Notification.objects.create(
            user=appointment.therapist.user,
            title="Appointment confirmed",
            message="A subscription booking was confirmed, but the meeting link could not be prepared automatically yet.",
            notification_type=Notification.TYPE_APPOINTMENT,
            metadata={"appointment_id": appointment.id},
        )
        return appointment

    appointment.meeting_provider = meeting_result.provider
    appointment.external_calendar_event_id = meeting_result.event_id
    appointment.meeting_link = meeting_result.meet_link
    appointment.meeting_status = meeting_result.status
    appointment.meeting_created_at = timezone.now()
    appointment.save(
        update_fields=[
            "meeting_provider",
            "external_calendar_event_id",
            "meeting_link",
            "meeting_status",
            "meeting_created_at",
            "updated_at",
        ]
    )
    if appointment.meeting_status == Appointment.MEETING_STATUS_READY and appointment.meeting_link:
        Notification.objects.create(
            user=appointment.user,
            title="Google Meet link ready",
            message="Your subscription-backed session is confirmed and the Google Meet link is ready.",
            notification_type=Notification.TYPE_APPOINTMENT,
            metadata={"appointment_id": appointment.id, "meeting_link": appointment.meeting_link},
        )
        Notification.objects.create(
            user=appointment.therapist.user,
            title="Subscription booking confirmed",
            message="A subscription-backed session is confirmed and the Google Meet link is ready.",
            notification_type=Notification.TYPE_APPOINTMENT,
            metadata={"appointment_id": appointment.id, "meeting_link": appointment.meeting_link},
        )
    return appointment


def book_with_subscription(*, user, therapist: TherapistProfile, availability_slot: TherapistAvailability, session_type: str, notes: str = "", subscription_id=None):
    expire_stale_subscriptions(user=user)
    if subscription_id:
        selected_subscription = next(
            iter(
                UserSubscription.objects.select_related("plan")
                .filter(user=user, pk=subscription_id)
                .order_by("id")
            ),
            None,
        )
        if selected_subscription and selected_subscription.expires_at and selected_subscription.expires_at <= timezone.now():
            if selected_subscription.status != UserSubscription.STATUS_EXPIRED:
                selected_subscription.status = UserSubscription.STATUS_EXPIRED
                selected_subscription.save(update_fields=["status", "updated_at"])

    with transaction.atomic():
        locked_slot = TherapistAvailability.objects.select_for_update().select_related("therapist__user").get(pk=availability_slot.pk)
        if locked_slot.therapist.approval_status != TherapistProfile.STATUS_APPROVED:
            raise ValidationError("Appointments can only be booked with approved therapists.")
        if not locked_slot.is_available:
            raise ValidationError("Selected availability slot is not available.")

        subscriptions = UserSubscription.objects.select_for_update().select_related("plan").filter(
            user=user,
            status=UserSubscription.STATUS_ACTIVE,
            payment_status=UserSubscription.PAYMENT_PAID,
            remaining_credits__gt=0,
        ).filter(models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=timezone.now()))
        if subscription_id:
            subscriptions = subscriptions.filter(pk=subscription_id)
        subscriptions = subscriptions.order_by("expires_at", "created_at", "id")
        subscription = next(iter(subscriptions), None)
        if subscription is None:
            raise ValidationError("You do not have an active package with remaining session credits.")

        appointment = Appointment.objects.create(
            user=user,
            therapist=therapist,
            availability_slot=locked_slot,
            session_type=session_type,
            scheduled_start=locked_slot.start_time,
            scheduled_end=locked_slot.end_time,
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID,
            payment_provider=PACKAGE_PAYMENT_PROVIDER,
            paid_amount=0,
            booking_payment_type=Appointment.BOOKING_PAYMENT_TYPE_PACKAGE,
            subscription=subscription,
            subscription_credit_consumed_at=timezone.now(),
            notes=notes,
        )
        subscription.remaining_credits -= 1
        subscription.save(update_fields=["remaining_credits", "updated_at"])
        locked_slot.is_available = False
        locked_slot.save(update_fields=["is_available", "updated_at"])

    create_appointment_event(appointment, user, appointment.status, "Booked using subscription credits.")
    ensure_appointment_conversation(appointment)
    notify_appointment_users(appointment, "Appointment confirmed", "Your subscription-backed booking is confirmed.")
    attach_google_meet_for_package_appointment(appointment)
    return appointment


def restore_subscription_credit_for_appointment(appointment: Appointment):
    if (
        appointment.booking_payment_type != Appointment.BOOKING_PAYMENT_TYPE_PACKAGE
        or not appointment.subscription_id
        or not appointment.subscription_credit_consumed_at
        or appointment.subscription_credit_restored_at
    ):
        return

    with transaction.atomic():
        locked_appointment = Appointment.objects.select_for_update().get(pk=appointment.pk)
        if locked_appointment.subscription_credit_restored_at or not locked_appointment.subscription_id:
            return
        subscription = UserSubscription.objects.select_for_update().get(pk=locked_appointment.subscription_id)
        subscription.remaining_credits += 1
        subscription.save(update_fields=["remaining_credits", "updated_at"])
        locked_appointment.subscription_credit_restored_at = timezone.now()
        locked_appointment.save(update_fields=["subscription_credit_restored_at", "updated_at"])
