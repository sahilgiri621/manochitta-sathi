from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AdminAction

User = get_user_model()


class AdminActionApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="audit-admin@example.com",
            password="AdminPass123!",
            first_name="Audit",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        self.action_today = AdminAction.objects.create(
            admin=self.admin,
            action="user_updated",
            target_type="user",
            target_id="10",
        )
        self.action_older = AdminAction.objects.create(
            admin=self.admin,
            action="therapist_approval_updated",
            target_type="therapist_profile",
            target_id="11",
        )
        AdminAction.objects.filter(pk=self.action_older.pk).update(created_at=timezone.now() - timedelta(days=4))
        self.action_older.refresh_from_db()

        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.admin.email, "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    def test_admin_can_filter_actions_by_custom_day(self):
        selected_date = timezone.localtime(self.action_older.created_at).date().isoformat()

        response = self.client.get(f"/api/v1/admin-actions/?date={selected_date}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        returned_ids = {item["id"] for item in results}
        self.assertIn(self.action_older.id, returned_ids)
        self.assertNotIn(self.action_today.id, returned_ids)
