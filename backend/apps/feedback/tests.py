from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.feedback.models import Feedback
from apps.therapists.models import TherapistProfile

User = get_user_model()


class FeedbackApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="feedback-user@example.com",
            password="UserPass123!",
            first_name="User",
            role="user",
            is_email_verified=True,
        )
        self.therapist_user = User.objects.create_user(
            email="feedback-therapist@example.com",
            password="Therapist123!",
            first_name="Therapist",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist = TherapistProfile.objects.get(user=self.therapist_user)
        self.appointment = Appointment.objects.create(
            user=self.user,
            therapist=self.therapist,
            session_type="video",
            scheduled_start="2099-01-01T10:00:00Z",
            scheduled_end="2099-01-01T10:50:00Z",
            status=Appointment.STATUS_COMPLETED,
        )
        self.feedback = Feedback.objects.create(
            appointment=self.appointment,
            user=self.user,
            therapist=self.therapist,
            rating=5,
            comment="Helpful session",
        )

    def test_therapist_can_view_received_feedback(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist_user.email, "password": "Therapist123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.get("/api/v1/feedback/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(response.data["data"]["results"][0]["comment"], "Helpful session")

    def test_admin_can_filter_feedback_by_custom_day(self):
        admin = User.objects.create_user(
            email="feedback-admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        Feedback.objects.filter(pk=self.feedback.pk).update(created_at=timezone.now() - timedelta(days=2))
        self.feedback.refresh_from_db()

        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": admin.email, "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

        selected_date = timezone.localtime(self.feedback.created_at).date().isoformat()
        response = self.client.get(f"/api/v1/feedback/?date={selected_date}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)

    def test_public_feedback_listing_can_be_filtered_by_therapist(self):
        other_therapist_user = User.objects.create_user(
            email="feedback-public-therapist@example.com",
            password="Therapist123!",
            first_name="Public Therapist",
            role="therapist",
            is_email_verified=True,
        )
        other_therapist = TherapistProfile.objects.get(user=other_therapist_user)
        other_appointment = Appointment.objects.create(
            user=self.user,
            therapist=other_therapist,
            session_type="video",
            scheduled_start="2099-01-02T10:00:00Z",
            scheduled_end="2099-01-02T10:50:00Z",
            status=Appointment.STATUS_COMPLETED,
        )
        Feedback.objects.create(
            appointment=other_appointment,
            user=self.user,
            therapist=other_therapist,
            rating=4,
            comment="Second therapist feedback",
        )

        self.client.credentials()
        response = self.client.get(f"/api/v1/feedback/?therapist_id={self.therapist.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["therapist"], self.therapist.id)
