from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

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

    def test_user_can_create_conversation_and_send_message(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "UserPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        conversation_response = self.client.post(
            "/api/v1/communications/conversations/",
            {"therapist": self.therapist.id},
            format="json",
        )
        self.assertEqual(conversation_response.status_code, status.HTTP_201_CREATED)
        conversation_id = conversation_response.data["data"]["id"]
        message_response = self.client.post(
            "/api/v1/communications/messages/",
            {"conversation": conversation_id, "content": "Hello therapist"},
            format="json",
        )
        self.assertEqual(message_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Conversation.objects.filter(pk=conversation_id).exists())
        self.assertTrue(Message.objects.filter(conversation_id=conversation_id, content="Hello therapist").exists())
