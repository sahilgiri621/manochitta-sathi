from dataclasses import dataclass
import logging
from typing import Any

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone

from apps.appointments.models import Appointment


logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"


@dataclass
class CalendarMeetingCreationResult:
    provider: str
    status: str
    event_id: str
    meet_link: str
    raw_response: dict[str, Any]


def _required_setting(name: str) -> str:
    value = getattr(settings, name, "") or ""
    if not value:
        raise ImproperlyConfigured(f"{name} is not configured.")
    return str(value).strip()


def _get_google_access_token() -> str:
    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": _required_setting("GOOGLE_CLIENT_ID"),
            "client_secret": _required_setting("GOOGLE_CLIENT_SECRET"),
            "refresh_token": _required_setting("GOOGLE_REFRESH_TOKEN"),
            "grant_type": "refresh_token",
        },
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    token = str(payload.get("access_token") or "").strip()
    if not token:
        raise RuntimeError("Google OAuth token response did not include an access token.")
    return token


def _build_event_payload(appointment: Appointment, request_id: str) -> dict[str, Any]:
    therapist_name = appointment.therapist.user.full_name or appointment.therapist.user.email
    patient_name = appointment.user.full_name or appointment.user.email
    organizer_email = (_required_setting("GOOGLE_MEET_ORGANIZER_EMAIL") if getattr(settings, "GOOGLE_MEET_ORGANIZER_EMAIL", "") else "")
    description_lines = [
        "Manochitta Sathi session created after verified payment.",
        f"Patient: {patient_name}",
        f"Therapist: {therapist_name}",
        f"Session type: {appointment.get_session_type_display()}",
    ]
    if organizer_email:
        description_lines.append(f"Organizer: {organizer_email}")
    if appointment.notes:
        description_lines.append(f"Booking notes: {appointment.notes}")

    attendees = [{"email": appointment.user.email}, {"email": appointment.therapist.user.email}]
    if organizer_email and organizer_email not in {appointment.user.email, appointment.therapist.user.email}:
        attendees.append({"email": organizer_email})

    return {
        "summary": f"Therapy Session: {patient_name} with {therapist_name}",
        "description": "\n".join(description_lines),
        "start": {
            "dateTime": appointment.scheduled_start.astimezone(timezone.get_current_timezone()).isoformat(),
            "timeZone": settings.TIME_ZONE,
        },
        "end": {
            "dateTime": appointment.scheduled_end.astimezone(timezone.get_current_timezone()).isoformat(),
            "timeZone": settings.TIME_ZONE,
        },
        "attendees": attendees,
        "conferenceData": {
            "createRequest": {
                "requestId": request_id,
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }


def create_google_meet_event_for_appointment(appointment: Appointment) -> CalendarMeetingCreationResult:
    if appointment.external_calendar_event_id or appointment.meeting_link:
        return CalendarMeetingCreationResult(
            provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
            status=appointment.meeting_status or Appointment.MEETING_STATUS_READY,
            event_id=appointment.external_calendar_event_id or "",
            meet_link=appointment.meeting_link or "",
            raw_response={},
        )

    calendar_id = _required_setting("GOOGLE_CALENDAR_ID")
    access_token = _get_google_access_token()
    request_id = f"appointment-{appointment.id}-payment-{appointment.payment_transaction_id or appointment.khalti_pidx or 'verified'}"
    payload = _build_event_payload(appointment, request_id)
    url = GOOGLE_CALENDAR_EVENTS_URL.format(calendar_id=calendar_id)

    response = requests.post(
        url,
        params={"conferenceDataVersion": 1, "sendUpdates": "all"},
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    conference_entry_points = ((data.get("conferenceData") or {}).get("entryPoints") or [])
    meet_link = str(data.get("hangoutLink") or "").strip()
    if not meet_link:
        for item in conference_entry_points:
            if item.get("entryPointType") == "video" and item.get("uri"):
                meet_link = str(item["uri"]).strip()
                break

    status = Appointment.MEETING_STATUS_READY if meet_link else Appointment.MEETING_STATUS_FAILED
    logger.info(
        "Google Calendar event created for appointment",
        extra={
            "appointment_id": str(appointment.id),
            "event_id": data.get("id", ""),
            "meeting_status": status,
            "has_meet_link": bool(meet_link),
        },
    )
    return CalendarMeetingCreationResult(
        provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
        status=status,
        event_id=str(data.get("id") or ""),
        meet_link=meet_link,
        raw_response=data,
    )
