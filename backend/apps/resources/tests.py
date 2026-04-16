from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Resource

User = get_user_model()


class ResourceApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="resource-admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        self.therapist = User.objects.create_user(
            email="resource-therapist@example.com",
            password="TherapistPass123!",
            first_name="Therapist",
            role="therapist",
            is_email_verified=True,
        )
        self.other_therapist = User.objects.create_user(
            email="resource-other-therapist@example.com",
            password="TherapistPass123!",
            first_name="Other",
            role="therapist",
            is_email_verified=True,
        )
        self.category = Category.objects.create(name="Self Help", description="Self-help resources")
        Resource.objects.create(
            title="Published Guide",
            category=self.category,
            summary="Visible resource",
            content="Published content",
            published=True,
        )
        Resource.objects.create(
            title="Draft Guide",
            category=self.category,
            summary="Hidden resource",
            content="Draft content",
            published=False,
        )
        self.therapist_resource = Resource.objects.create(
            title="Therapist Guide",
            category=self.category,
            summary="Therapist authored content",
            content="Authored by therapist",
            published=True,
            created_by=self.therapist,
        )

    def test_public_listing_only_returns_published_resources(self):
        response = self.client.get("/api/v1/resources/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["data"]["results"]]
        self.assertIn("Published Guide", titles)
        self.assertIn("Therapist Guide", titles)
        self.assertNotIn("Draft Guide", titles)

    def test_admin_can_create_category_and_resource(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.admin.email, "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        category_response = self.client.post(
            "/api/v1/resources/categories/",
            {"name": "Videos", "description": "Video library"},
            format="json",
        )
        self.assertEqual(category_response.status_code, status.HTTP_201_CREATED)
        resource_response = self.client.post(
            "/api/v1/resources/",
            {
                "title": "Breathing Exercise",
                "category": category_response.data["data"]["id"],
                "summary": "Quick grounding technique",
                "content": "Step by step breathing guide",
                "format": "guide",
                "published": True,
            },
            format="json",
        )
        self.assertEqual(resource_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Resource.objects.filter(title="Breathing Exercise").exists())

    def test_resource_create_rejects_invalid_category(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.admin.email, "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.post(
            "/api/v1/resources/",
            {
                "title": "Broken Resource",
                "category": 999999,
                "summary": "Should fail",
                "content": "Missing category",
                "format": "guide",
                "published": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_create_resource(self):
        user = User.objects.create_user(
            email="resource-user@example.com",
            password="UserPass123!",
            first_name="User",
            role="user",
            is_email_verified=True,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "UserPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.post(
            "/api/v1/resources/",
            {
                "title": "Unauthorized Resource",
                "category": self.category.id,
                "summary": "Should fail",
                "content": "Unauthorized",
                "format": "guide",
                "published": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_therapist_can_create_and_edit_own_resource(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist.email, "password": "TherapistPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        create_response = self.client.post(
            "/api/v1/resources/",
            {
                "title": "Sleep Hygiene",
                "category": self.category.id,
                "summary": "Tips for better sleep",
                "content": "Therapist sleep content",
                "format": "guide",
                "published": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        resource_id = create_response.data["data"]["id"]
        update_response = self.client.patch(
            f"/api/v1/resources/{resource_id}/",
            {"summary": "Updated summary"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Resource.objects.get(pk=resource_id).created_by, self.therapist)

    def test_therapist_cannot_edit_another_therapists_resource(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.other_therapist.email, "password": "TherapistPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.patch(
            f"/api/v1/resources/{self.therapist_resource.id}/",
            {"summary": "Tampered"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_therapist_only_lists_own_resources(self):
        Resource.objects.create(
            title="Other Therapist Guide",
            category=self.category,
            summary="Other content",
            content="Other therapist content",
            published=False,
            created_by=self.other_therapist,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist.email, "password": "TherapistPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.get("/api/v1/resources/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["data"]["results"]]
        self.assertIn("Therapist Guide", titles)
        self.assertNotIn("Other Therapist Guide", titles)
