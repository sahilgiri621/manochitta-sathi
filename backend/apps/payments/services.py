from dataclasses import dataclass
import logging
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.appointments.models import Appointment
from apps.notifications.models import Notification
from apps.therapists.models import TherapistAvailability

from .google_calendar_service import create_google_meet_event_for_appointment


KHALTI_PROVIDER = "khalti"
KHALTI_INITIATE_ENDPOINT = "/epayment/initiate/"
KHALTI_LOOKUP_ENDPOINT = "/epayment/lookup/"
SUCCESS_STATUSES = {"completed", "paid"}
PENDING_STATUSES = {"pending", "initiated"}
CANCELLED_STATUSES = {"user canceled", "cancelled"}
EXPIRED_STATUSES = {"expired"}
REFUNDED_STATUSES = {"refunded"}

logger = logging.getLogger(__name__)


@dataclass
class KhaltiInitiationResult:
    payment_url: str
    pidx: str
    amount: int


def _notify_meeting_link_ready(appointment: Appointment):
    Notification.objects.create(
        user=appointment.user,
        title="Google Meet link ready",
        message="Your session is confirmed and the Google Meet link is ready.",
        notification_type=Notification.TYPE_APPOINTMENT,
        metadata={"appointment_id": appointment.id, "meeting_link": appointment.meeting_link},
    )
    Notification.objects.create(
        user=appointment.therapist.user,
        title="Paid booking confirmed",
        message="A paid booking has been confirmed and the Google Meet link is ready.",
        notification_type=Notification.TYPE_APPOINTMENT,
        metadata={"appointment_id": appointment.id, "meeting_link": appointment.meeting_link},
    )


def build_khalti_return_url(appointment: Appointment, frontend_origin: str | None = None) -> str:
    base_return_url = settings.KHALTI_RETURN_URL
    if frontend_origin:
        origin = frontend_origin.strip().rstrip("/")
        parts = urlsplit(origin)
        if parts.scheme in {"http", "https"} and parts.netloc:
            base_return_url = f"{origin}/payment/result/khalti"

    parts = urlsplit(base_return_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["appointment"] = str(appointment.id)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def get_khalti_headers():
    if not settings.KHALTI_SECRET_KEY:
        raise ValidationError("Khalti secret key is not configured.")
    return {
        "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def get_khalti_amount_for_appointment(appointment: Appointment) -> int:
    consultation_fee = appointment.therapist.consultation_fee
    if consultation_fee is None or consultation_fee <= 0:
        raise ValidationError("This appointment does not have a payable therapist fee.")
    return int(consultation_fee * 100)


def resolve_frontend_origin(frontend_origin: str | None) -> str | None:
    if not frontend_origin:
        return None
    origin = frontend_origin.strip().rstrip("/")
    parts = urlsplit(origin)
    if parts.scheme in {"http", "https"} and parts.netloc:
        return origin
    return None


def ensure_payable_appointment(appointment: Appointment, user):
    if appointment.user_id != user.id:
        raise ValidationError("You can only pay for your own appointment.")
    if appointment.status in {
        Appointment.STATUS_CANCELLED,
        Appointment.STATUS_REJECTED,
        Appointment.STATUS_COMPLETED,
    }:
        raise ValidationError("This appointment is not payable in its current state.")
    if appointment.payment_status == Appointment.PAYMENT_PAID:
        raise ValidationError("This appointment has already been paid.")
    if appointment.status not in {Appointment.STATUS_PENDING_PAYMENT, Appointment.STATUS_PENDING}:
        raise ValidationError("This appointment cannot start a payment in its current state.")


def initiate_khalti_payment(appointment: Appointment, frontend_origin: str | None = None) -> KhaltiInitiationResult:
    amount = get_khalti_amount_for_appointment(appointment)
    resolved_frontend_origin = resolve_frontend_origin(frontend_origin)
    payload = {
        "return_url": build_khalti_return_url(appointment, resolved_frontend_origin),
        "website_url": resolved_frontend_origin or settings.KHALTI_WEBSITE_URL,
        "amount": amount,
        "purchase_order_id": f"appointment-{appointment.id}",
        "purchase_order_name": f"Therapy session with {appointment.therapist.user.full_name}",
        "customer_info": {
            "name": appointment.user.full_name,
            "email": appointment.user.email,
            "phone": appointment.user.phone or "",
        },
    }
    logger.info(
        "Calling Khalti initiate",
        extra={
            "appointment_id": str(appointment.id),
            "amount": amount,
            "return_url": payload["return_url"],
            "website_url": payload["website_url"],
            "purchase_order_id": payload["purchase_order_id"],
        },
    )
    response = requests.post(
        f"{settings.KHALTI_BASE_URL.rstrip('/')}{KHALTI_INITIATE_ENDPOINT}",
        json=payload,
        headers=get_khalti_headers(),
        timeout=20,
    )
    raw_body = response.text
    try:
        data = response.json()
    except ValueError:
        data = {}
    logger.info(
        "Khalti initiate responded",
        extra={
            "appointment_id": str(appointment.id),
            "status_code": response.status_code,
            "has_payment_url": bool(data.get("payment_url")),
            "has_pidx": bool(data.get("pidx")),
            "response_body": raw_body[:1000],
        },
    )
    if not response.ok:
        message = "Unable to initiate Khalti payment right now."
        detail = data.get("detail") if isinstance(data, dict) else None
        if isinstance(detail, str) and detail:
            message = f"Khalti returned an error: {detail}"
        raise ValidationError(message)
    if not data.get("payment_url"):
        raise ValidationError("Payment initiation failed: Khalti did not return a payment URL.")
    if not data.get("pidx"):
        raise ValidationError("Payment initiation failed: Khalti did not return a payment reference.")
    appointment.payment_status = Appointment.PAYMENT_PENDING
    appointment.payment_provider = KHALTI_PROVIDER
    appointment.paid_amount = amount
    appointment.khalti_pidx = data.get("pidx", "")
    appointment.payment_initiated_at = timezone.now()
    appointment.payment_transaction_id = ""
    appointment.payment_verified_at = None
    appointment.save(
        update_fields=[
            "payment_status",
            "payment_provider",
            "paid_amount",
            "khalti_pidx",
            "payment_initiated_at",
            "payment_transaction_id",
            "payment_verified_at",
            "updated_at",
        ]
    )
    return KhaltiInitiationResult(
        payment_url=data["payment_url"],
        pidx=data["pidx"],
        amount=amount,
    )


def lookup_khalti_payment(pidx: str) -> dict:
    logger.info("Calling Khalti lookup", extra={"pidx": pidx})
    response = requests.post(
        f"{settings.KHALTI_BASE_URL.rstrip('/')}{KHALTI_LOOKUP_ENDPOINT}",
        json={"pidx": pidx},
        headers=get_khalti_headers(),
        timeout=20,
    )
    raw_body = response.text
    try:
        data = response.json()
    except ValueError:
        data = {}
    logger.info(
        "Khalti lookup responded",
        extra={
            "pidx": pidx,
            "status_code": response.status_code,
            "lookup_status": data.get("status") if isinstance(data, dict) else "",
            "response_body": raw_body[:1000],
        },
    )
    if not response.ok:
        message = "Unable to verify Khalti payment right now."
        detail = data.get("detail") if isinstance(data, dict) else None
        if isinstance(detail, str) and detail:
            message = f"Khalti returned an error: {detail}"
        raise ValidationError(message)
    return data


def sync_appointment_payment_from_lookup(appointment: Appointment, lookup_data: dict) -> Appointment:
    raw_status = str(lookup_data.get("status", "")).strip()
    normalized_status = raw_status.lower()
    pidx = str(lookup_data.get("pidx") or appointment.khalti_pidx or "")
    transaction_id = str(lookup_data.get("transaction_id") or lookup_data.get("txn_id") or "")
    total_amount = int(lookup_data.get("total_amount") or lookup_data.get("amount") or appointment.paid_amount or 0)

    transitioned_to_paid = False

    meeting_creation_needed = False
    meeting_became_ready = False

    with transaction.atomic():
        appointment = Appointment.objects.select_for_update().get(pk=appointment.pk)
        appointment.payment_provider = KHALTI_PROVIDER
        appointment.khalti_pidx = pidx
        appointment.payment_transaction_id = transaction_id
        appointment.paid_amount = total_amount

        if normalized_status in SUCCESS_STATUSES:
            if appointment.availability_slot_id:
                slot = TherapistAvailability.objects.select_for_update().get(pk=appointment.availability_slot_id)
                if not slot.is_available and appointment.payment_status != Appointment.PAYMENT_PAID:
                    raise ValidationError("This slot is no longer available. The booking could not be confirmed.")
                if slot.is_available:
                    slot.is_available = False
                    slot.save(update_fields=["is_available", "updated_at"])
            if appointment.payment_status != Appointment.PAYMENT_PAID:
                appointment.status = Appointment.STATUS_CONFIRMED
                transitioned_to_paid = True
            appointment.payment_status = Appointment.PAYMENT_PAID
            appointment.payment_verified_at = appointment.payment_verified_at or timezone.now()
            if not appointment.external_calendar_event_id and not appointment.meeting_link:
                appointment.meeting_status = Appointment.MEETING_STATUS_PENDING
                meeting_creation_needed = True
        elif normalized_status in PENDING_STATUSES:
            appointment.status = Appointment.STATUS_PENDING_PAYMENT
            appointment.payment_status = Appointment.PAYMENT_PENDING
        elif normalized_status in CANCELLED_STATUSES:
            appointment.status = Appointment.STATUS_PENDING_PAYMENT
            appointment.payment_status = Appointment.PAYMENT_CANCELLED
        elif normalized_status in EXPIRED_STATUSES:
            appointment.status = Appointment.STATUS_PENDING_PAYMENT
            appointment.payment_status = Appointment.PAYMENT_EXPIRED
        elif normalized_status in REFUNDED_STATUSES:
            appointment.status = Appointment.STATUS_CANCELLED
            appointment.payment_status = Appointment.PAYMENT_REFUNDED
            appointment.payment_verified_at = timezone.now()
            if appointment.availability_slot_id:
                TherapistAvailability.objects.filter(pk=appointment.availability_slot_id).update(
                    is_available=True,
                    updated_at=timezone.now(),
                )
        else:
            appointment.status = Appointment.STATUS_PENDING_PAYMENT
            appointment.payment_status = Appointment.PAYMENT_FAILED

        appointment.save(
            update_fields=[
                "status",
                "payment_status",
                "payment_provider",
                "khalti_pidx",
                "payment_transaction_id",
                "paid_amount",
                "payment_verified_at",
                "meeting_status",
                "updated_at",
            ]
        )

    meeting_error_message = ""
    if normalized_status in SUCCESS_STATUSES and meeting_creation_needed:
        try:
            meeting_result = create_google_meet_event_for_appointment(appointment)
        except (ImproperlyConfigured, requests.RequestException, RuntimeError) as exc:
            logger.exception("Google Meet creation failed", extra={"appointment_id": str(appointment.id)})
            appointment.meeting_provider = Appointment.MEETING_PROVIDER_GOOGLE_MEET
            appointment.meeting_status = Appointment.MEETING_STATUS_FAILED
            appointment.save(update_fields=["meeting_provider", "meeting_status", "updated_at"])
            meeting_error_message = str(exc)
        else:
            appointment.meeting_provider = meeting_result.provider
            appointment.external_calendar_event_id = meeting_result.event_id
            appointment.meeting_link = meeting_result.meet_link
            appointment.meeting_status = meeting_result.status
            appointment.meeting_created_at = timezone.now()
            meeting_became_ready = appointment.meeting_status == Appointment.MEETING_STATUS_READY and bool(appointment.meeting_link)
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

    if normalized_status in SUCCESS_STATUSES and transitioned_to_paid:
        from apps.appointments.services import create_appointment_event, notify_appointment_users

        create_appointment_event(appointment, appointment.user, appointment.status, "Payment verified. Booking confirmed.")
        notify_appointment_users(appointment, "Appointment confirmed", "Your appointment is confirmed after successful payment.")
        if appointment.meeting_status == Appointment.MEETING_STATUS_READY and appointment.meeting_link:
            _notify_meeting_link_ready(appointment)
        elif meeting_error_message:
            Notification.objects.create(
                user=appointment.user,
                title="Booking confirmed",
                message="Your payment was verified and the booking is confirmed. The meeting link is still being prepared.",
                notification_type=Notification.TYPE_APPOINTMENT,
                metadata={"appointment_id": appointment.id},
            )
            Notification.objects.create(
                user=appointment.therapist.user,
                title="Booking confirmed",
                message="A paid booking was confirmed, but the meeting link could not be prepared automatically yet.",
                notification_type=Notification.TYPE_APPOINTMENT,
                metadata={"appointment_id": appointment.id},
            )
    elif normalized_status in SUCCESS_STATUSES and meeting_became_ready:
        _notify_meeting_link_ready(appointment)

    return appointment
