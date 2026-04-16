from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Notification

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="notify@example.com",
            password="NotifyPass123!",
            first_name="Notify",
            role="user",
            is_email_verified=True,
        )
        other_user = User.objects.create_user(
            email="other-notify@example.com",
            password="NotifyPass123!",
            first_name="Other",
            role="user",
            is_email_verified=True,
        )
        self.notification = Notification.objects.create(
            user=self.user,
            title="Appointment update",
            message="Your appointment was accepted.",
            notification_type=Notification.TYPE_APPOINTMENT,
        )
        Notification.objects.create(
            user=other_user,
            title="Other",
            message="Should not appear.",
            notification_type=Notification.TYPE_GENERAL,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "NotifyPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    def test_user_can_list_and_mark_own_notifications_read(self):
        list_response = self.client.get("/api/v1/notifications/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["data"]["count"], 1)

        mark_response = self.client.post(f"/api/v1/notifications/{self.notification.id}/mark_read/", {}, format="json")
        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_user_can_filter_notifications_by_custom_day(self):
        Notification.objects.filter(pk=self.notification.pk).update(created_at=timezone.now() - timedelta(days=1))
        self.notification.refresh_from_db()

        selected_date = timezone.localtime(self.notification.created_at).date().isoformat()
        response = self.client.get(f"/api/v1/notifications/?date={selected_date}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
