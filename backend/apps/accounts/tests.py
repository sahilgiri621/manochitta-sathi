from datetime import timedelta
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase

from apps.auditlog.models import AdminAction
from apps.profiles.models import UserProfile
from apps.therapists.models import TherapistProfile

from .models import User


class AuthenticationFlowTests(APITestCase):
    def test_register_and_login_flow(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "user@example.com",
                "phone": None,
                "first_name": "Hari",
                "last_name": "Nepal",
                "password": "StrongPass123",
                "role": "user",
                "age": 29,
                "gender": "male",
                "wellbeing_goals": "Manage stress",
                "bio": "Testing profile persistence",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="user@example.com")
        self.assertTrue(user.is_email_verified)
        profile = UserProfile.objects.get(user=user)
        self.assertEqual(profile.age, 29)
        self.assertEqual(profile.gender, "male")
        self.assertIn("stress", profile.wellbeing_goals.lower())

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "user@example.com", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data["data"])
        self.assertIn("refresh", login_response.data["data"])

    def test_logout_rejects_invalid_refresh_token(self):
        user = User.objects.create_user(
            email="verified@example.com",
            password="ValidPass123!",
            first_name="Verified",
            role="user",
            is_email_verified=True,
        )
        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "verified@example.com", "password": "ValidPass123!"},
            format="json",
        )
        access = login_response.data["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.post("/api/v1/auth/logout/", {"refresh": "bad-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_therapist_cannot_login_until_approved(self):
        therapist = User.objects.create_user(
            email="pending-therapist-login@example.com",
            password="Therapist123!",
            first_name="Pending",
            role=User.ROLE_THERAPIST,
            is_email_verified=True,
        )

        pending_response = self.client.post(
            "/api/v1/auth/login/",
            {"email": therapist.email, "password": "Therapist123!"},
            format="json",
        )

        self.assertEqual(pending_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("approved", str(pending_response.data).lower())

        therapist_profile = TherapistProfile.objects.get(user=therapist)
        therapist_profile.approval_status = TherapistProfile.STATUS_APPROVED
        therapist_profile.save(update_fields=["approval_status", "updated_at"])

        approved_response = self.client.post(
            "/api/v1/auth/login/",
            {"email": therapist.email, "password": "Therapist123!"},
            format="json",
        )

        self.assertEqual(approved_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", approved_response.data["data"])

    @patch("apps.accounts.views.send_verification_email")
    def test_resend_verification_sends_for_unverified_user(self, mock_send_verification_email):
        User.objects.create_user(
            email="pending@example.com",
            password="ValidPass123!",
            first_name="Pending",
            role="user",
            is_email_verified=False,
        )

        response = self.client.post(
            "/api/v1/auth/resend-verification/",
            {"email": "pending@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_verification_email.assert_called_once()


class GoogleAuthenticationTests(APITestCase):
    @patch("apps.accounts.views.verify_google_credential")
    def test_google_auth_creates_user_and_returns_jwt(self, mock_verify):
        mock_verify.return_value = {
            "sub": "google-user-1",
            "email": "googleuser@example.com",
            "email_verified": True,
            "given_name": "Google",
            "family_name": "User",
            "iss": "https://accounts.google.com",
        }

        response = self.client.post("/api/v1/auth/google/", {"credential": "valid-credential"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        user = User.objects.get(email="googleuser@example.com")
        self.assertEqual(user.google_sub, "google-user-1")
        self.assertTrue(user.is_email_verified)

    @patch("apps.accounts.views.verify_google_credential")
    def test_google_auth_links_existing_user_by_email(self, mock_verify):
        user = User.objects.create_user(
            email="member@example.com",
            password="MemberPass123!",
            first_name="Member",
            role="user",
            is_email_verified=False,
        )
        mock_verify.return_value = {
            "sub": "linked-google-sub",
            "email": "member@example.com",
            "email_verified": True,
            "given_name": "Member",
            "family_name": "User",
            "iss": "https://accounts.google.com",
        }

        response = self.client.post("/api/v1/auth/google/", {"credential": "valid-credential"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.google_sub, "linked-google-sub")
        self.assertTrue(user.is_email_verified)

    @patch("apps.accounts.views.verify_google_credential")
    def test_google_auth_rejects_invalid_token(self, mock_verify):
        mock_verify.side_effect = ValidationError("Invalid Google credential.")

        response = self.client.post("/api/v1/auth/google/", {"credential": "bad-credential"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.accounts.views.verify_google_credential")
    def test_google_auth_returns_service_unavailable_for_configuration_error(self, mock_verify):
        mock_verify.side_effect = ImproperlyConfigured("Google auth unavailable")

        response = self.client.post("/api/v1/auth/google/", {"credential": "bad-credential"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class AdminUserManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            role="admin",
            is_staff=True,
            is_superuser=True,
            is_email_verified=True,
        )
        self.user = User.objects.create_user(
            email="member@example.com",
            password="MemberPass123!",
            first_name="Member",
            role="user",
            is_email_verified=True,
        )
        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "admin@example.com", "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['data']['access']}")

    def test_admin_can_update_and_deactivate_user(self):
        patch_response = self.client.patch(
            f"/api/v1/auth/admin/users/{self.user.id}/",
            {"role": "therapist", "is_email_verified": True},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "therapist")
        self.assertTrue(self.user.is_email_verified)

        deactivate_response = self.client.post(f"/api/v1/auth/admin/users/{self.user.id}/deactivate/", {}, format="json")
        self.assertEqual(deactivate_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertTrue(AdminAction.objects.filter(target_type="user", target_id=str(self.user.id)).exists())

    def test_admin_can_filter_users_by_created_day(self):
        older_user = User.objects.create_user(
            email="older-member@example.com",
            password="MemberPass123!",
            first_name="Older",
            role="user",
            is_email_verified=True,
        )
        User.objects.filter(pk=older_user.pk).update(created_at=timezone.now() - timedelta(days=2))
        older_user.refresh_from_db()

        selected_date = timezone.localtime(older_user.created_at).date().isoformat()
        response = self.client.get(f"/api/v1/auth/admin/users/?date={selected_date}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        returned_ids = {item["id"] for item in results}
        self.assertIn(older_user.id, returned_ids)
        self.assertNotIn(self.user.id, returned_ids)
