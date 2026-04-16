from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.feedback.models import Feedback
from apps.therapists.models import TherapistAvailability, TherapistProfile

User = get_user_model()


class AppointmentFlowTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="AdminPass123",
            first_name="Admin",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        self.user = User.objects.create_user(
            email="user@example.com",
            password="UserPass123",
            first_name="User",
            role="user",
            is_email_verified=True,
        )
        self.therapist_user = User.objects.create_user(
            email="therapist@example.com",
            password="Therapist123",
            first_name="Thera",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist_profile = TherapistProfile.objects.get(user=self.therapist_user)
        self.therapist_profile.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist_profile.save(update_fields=["approval_status"])
        self.slot = TherapistAvailability.objects.create(
            therapist=self.therapist_profile,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, minutes=50),
        )

    def authenticate(self, user):
        response = self.client.post("/api/v1/auth/login/", {"email": user.email, "password": "AdminPass123" if user == self.admin else ("UserPass123" if user == self.user else "Therapist123")}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['data']['access']}")

    def test_admin_can_approve_therapist(self):
        pending_user = User.objects.create_user(
            email="pending@example.com",
            password="PendingPass123",
            first_name="Pending",
            role="therapist",
            is_email_verified=True,
        )
        pending_profile = TherapistProfile.objects.get(user=pending_user)
        self.authenticate(self.admin)
        response = self.client.post(
            f"/api/v1/therapists/profiles/{pending_profile.id}/approve/",
            {"approval_status": "approved"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_profile.refresh_from_db()
        self.assertEqual(pending_profile.approval_status, TherapistProfile.STATUS_APPROVED)

    def test_user_can_book_complete_and_leave_feedback_once(self):
        self.authenticate(self.user)
        create_response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist_profile.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "scheduled_start": self.slot.start_time.isoformat(),
                "scheduled_end": self.slot.end_time.isoformat(),
                "notes": "Need support with stress.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        appointment_id = create_response.data["data"]["id"]
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_available)
        appointment = self.user.appointments.get(pk=appointment_id)
        appointment.status = Appointment.STATUS_CONFIRMED
        appointment.payment_status = Appointment.PAYMENT_PAID
        appointment.availability_slot = self.slot
        appointment.save(update_fields=["status", "payment_status", "availability_slot", "updated_at"])
        self.slot.is_available = False
        self.slot.save(update_fields=["is_available", "updated_at"])

        self.client.credentials()
        self.authenticate(self.therapist_user)
        complete_response = self.client.post(
            f"/api/v1/appointments/{appointment_id}/complete/",
            {
                "notes": "Patient was engaged throughout the session.",
                "session_summary": "Reviewed stress triggers and coping methods.",
                "patient_progress": "Moderate progress since the previous check-in.",
                "recommendations": "Continue the breathing practice daily.",
                "next_steps": "Follow up next week.",
                "risk_flag": "",
            },
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        self.client.credentials()
        self.authenticate(self.user)
        feedback_response = self.client.post(
            "/api/v1/feedback/",
            {"appointment": appointment_id, "rating": 5, "comment": "Very supportive session."},
            format="json",
        )
        self.assertEqual(feedback_response.status_code, status.HTTP_201_CREATED)
        duplicate_response = self.client.post(
            "/api/v1/feedback/",
            {"appointment": appointment_id, "rating": 4, "comment": "Second review."},
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Feedback.objects.count(), 1)

    def test_booking_creates_pending_payment_intent_and_keeps_slot_open(self):
        self.authenticate(self.user)
        first_response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist_profile.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "notes": "First booking.",
            },
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first_response.data["data"]["status"], Appointment.STATUS_PENDING_PAYMENT)
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_available)

        self.client.credentials()
        other_user = User.objects.create_user(
            email="second-user@example.com",
            password="SecondUser123",
            first_name="Second",
            role="user",
            is_email_verified=True,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": other_user.email, "password": "SecondUser123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        second_response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist_profile.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "notes": "Second booking intent should also be allowed until payment succeeds.",
            },
            format="json",
        )
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_available)

    def test_paid_booking_is_confirmed_without_therapist_acceptance(self):
        self.authenticate(self.user)
        create_response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist_profile.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "notes": "Auto-confirm after payment.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        appointment = self.user.appointments.get(pk=create_response.data["data"]["id"])
        appointment.status = Appointment.STATUS_CONFIRMED
        appointment.payment_status = Appointment.PAYMENT_PAID
        appointment.availability_slot = self.slot
        appointment.save(update_fields=["status", "payment_status", "availability_slot", "updated_at"])
        self.slot.is_available = False
        self.slot.save(update_fields=["is_available", "updated_at"])

        self.client.credentials()
        self.authenticate(self.therapist_user)
        accept_response = self.client.post(f"/api/v1/appointments/{appointment.id}/accept/", {}, format="json")
        reject_response = self.client.post(f"/api/v1/appointments/{appointment.id}/reject/", {}, format="json")

        self.assertEqual(accept_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(reject_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_filter_appointments_by_custom_day(self):
        appointment_one = self.user.appointments.create(
            therapist=self.therapist_profile,
            session_type="video",
            scheduled_start=timezone.now() + timedelta(days=5),
            scheduled_end=timezone.now() + timedelta(days=5, minutes=50),
            notes="First day filter target.",
        )
        appointment_two = self.user.appointments.create(
            therapist=self.therapist_profile,
            session_type="video",
            scheduled_start=timezone.now() + timedelta(days=6),
            scheduled_end=timezone.now() + timedelta(days=6, minutes=50),
            notes="Second day filter target.",
        )

        self.authenticate(self.admin)
        selected_date = timezone.localtime(appointment_one.scheduled_start).date().isoformat()
        response = self.client.get(f"/api/v1/appointments/?date={selected_date}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        returned_ids = {item["id"] for item in results}
        self.assertIn(appointment_one.id, returned_ids)
        self.assertNotIn(appointment_two.id, returned_ids)

    def test_therapist_cannot_complete_without_required_form(self):
        appointment = self.user.appointments.create(
            therapist=self.therapist_profile,
            availability_slot=self.slot,
            session_type="video",
            scheduled_start=self.slot.start_time,
            scheduled_end=self.slot.end_time,
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID,
        )
        self.slot.is_available = False
        self.slot.save(update_fields=["is_available", "updated_at"])

        self.authenticate(self.therapist_user)
        response = self.client.post(f"/api/v1/appointments/{appointment.id}/complete/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.STATUS_CONFIRMED)

    def test_patient_and_therapist_can_view_meeting_link_but_other_user_cannot(self):
        appointment = self.user.appointments.create(
            therapist=self.therapist_profile,
            session_type="video",
            scheduled_start=timezone.now() + timedelta(days=2),
            scheduled_end=timezone.now() + timedelta(days=2, minutes=50),
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID,
            meeting_provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
            meeting_link="https://meet.google.com/test-link",
            external_calendar_event_id="calendar-event-1",
            meeting_status=Appointment.MEETING_STATUS_READY,
        )
        other_user = User.objects.create_user(
            email="outsider@example.com",
            password="Outsider123",
            first_name="Outsider",
            role="user",
            is_email_verified=True,
        )

        self.authenticate(self.user)
        patient_response = self.client.get(f"/api/v1/appointments/{appointment.id}/")
        self.assertEqual(patient_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patient_response.data["data"]["meeting_link"], "https://meet.google.com/test-link")

        self.client.credentials()
        self.authenticate(self.therapist_user)
        therapist_response = self.client.get(f"/api/v1/appointments/{appointment.id}/")
        self.assertEqual(therapist_response.status_code, status.HTTP_200_OK)
        self.assertEqual(therapist_response.data["data"]["meeting_link"], "https://meet.google.com/test-link")

        self.client.credentials()
        self.authenticate(other_user)
        outsider_response = self.client.get(f"/api/v1/appointments/{appointment.id}/")
        self.assertEqual(outsider_response.status_code, status.HTTP_404_NOT_FOUND)
