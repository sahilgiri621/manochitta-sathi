from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.profiles.models import UserProfile
from apps.resources.models import Category, Resource
from apps.therapists.models import TherapistProfile


User = get_user_model()


class AIChatApiTests(APITestCase):
    def setUp(self):
        self.therapist_user = User.objects.create_user(
            email="chat-therapist@example.com",
            password="Therapist123!",
            first_name="Asha",
            last_name="Guide",
            role="therapist",
            is_email_verified=True,
            is_active=True,
        )
        UserProfile.objects.filter(user=self.therapist_user).update(age=31, gender="female")
        self.therapist = TherapistProfile.objects.get(user=self.therapist_user)
        self.therapist.specialization = "Stress and anxiety support"
        self.therapist.qualifications = "MPhil Psychology"
        self.therapist.languages = "English, Nepali"
        self.therapist.experience_years = 7
        self.therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist.save()

        category = Category.objects.create(name="Stress Management", description="Stress support")
        Resource.objects.create(
            title="Breathing for Stress Relief",
            category=category,
            summary="A simple grounding resource.",
            content="Breathing and grounding exercises for stress.",
            published=True,
        )

    @patch(
        "apps.ai.views.generate_grounded_ai_reply",
        return_value='{"reply":"It sounds like stress is weighing on you. These options may help.","recommended_therapists":[{"id":1,"reason":"Good fit for stress support."}],"recommended_resources":[{"id":1,"reason":"Useful for grounding."}]}',
    )
    def test_chat_endpoint_returns_reply(self, mocked_generate):
        response = self.client.post(
            "/api/v1/ai/chat/",
            {
                "message": "I have been feeling stressed lately",
                "conversation_context": [{"role": "user", "content": "I feel overwhelmed with work"}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("stress", response.data["data"]["reply"].lower())
        self.assertEqual(len(response.data["data"]["recommended_therapists"]), 1)
        self.assertEqual(response.data["data"]["recommended_therapists"][0]["name"], "Asha Guide")
        self.assertEqual(len(response.data["data"]["recommended_resources"]), 1)
        mocked_generate.assert_called_once()

    def test_chat_endpoint_rejects_blank_messages(self):
        response = self.client.post("/api/v1/ai/chat/", {"message": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch(
        "apps.ai.views.generate_grounded_ai_reply",
        return_value='{"reply":"Hi. I can help with general wellbeing questions, and if you want I can also recommend therapists or resources.","recommended_therapists":[],"recommended_resources":[]}',
    )
    def test_chat_endpoint_does_not_force_recommendations_for_casual_messages(self, mocked_generate):
        response = self.client.post(
            "/api/v1/ai/chat/",
            {
                "message": "hi",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["recommended_therapists"], [])
        self.assertEqual(response.data["data"]["recommended_resources"], [])
        self.assertIn("recommend", response.data["data"]["reply"].lower())
        mocked_generate.assert_called_once()
