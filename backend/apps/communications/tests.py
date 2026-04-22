from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.therapists.models import TherapistProfile

from .models import Conversation, Message

User = get_user_model()


class CommunicationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="chat-user@example.com",
            password="UserPass123!",
            first_name="Chat",
            last_name="User",
            role="user",
            is_email_verified=True,
        )
        therapist_user = User.objects.create_user(
            email="chat-therapist@example.com",
            password="Therapist123!",
            first_name="Chat",
            last_name="Therapist",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist = TherapistProfile.objects.get(user=therapist_user)
        self.appointment = Appointment.objects.create(
            user=self.user,
            therapist=self.therapist,
            session_type="video",
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, minutes=50),
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID,
        )

    def test_user_can_send_message_in_existing_conversation(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "UserPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        conversation = Conversation.objects.create(
            appointment=self.appointment,
            user=self.user,
            therapist=self.therapist,
        )
        message_response = self.client.post(
            "/api/v1/communications/messages/",
            {"conversation": conversation.id, "content": "Hello therapist"},
            format="json",
        )
        self.assertEqual(message_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Message.objects.filter(conversation_id=conversation.id, content="Hello therapist").exists())
