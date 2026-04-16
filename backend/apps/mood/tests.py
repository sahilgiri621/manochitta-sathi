import importlib
from datetime import date

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import MoodEntry

User = get_user_model()
normalize_mood_values = importlib.import_module("apps.mood.migrations.0002_update_mood_values").normalize_mood_values


class MoodEntryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="mood@example.com",
            password="MoodPass123",
            first_name="Mood",
            role="user",
            is_email_verified=True,
        )
        response = self.client.post("/api/v1/auth/login/", {"email": "mood@example.com", "password": "MoodPass123"}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['data']['access']}")

    def test_unique_mood_entry_per_day(self):
        payload = {
            "entry_date": "2026-03-14",
            "mood": "happy",
            "stress_level": 2,
            "energy_level": 4,
            "notes": "Felt productive.",
        }
        first_response = self.client.post("/api/v1/mood/", payload, format="json")
        second_response = self.client.post("/api/v1/mood/", payload, format="json")
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mood_entry_returns_readable_label_and_score(self):
        response = self.client.post(
            "/api/v1/mood/",
            {
                "entry_date": "2026-03-15",
                "mood": "anxious",
                "stress_level": 4,
                "energy_level": 2,
                "notes": "Busy day.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["mood"], "anxious")
        self.assertEqual(response.data["data"]["mood_label"], "Anxious")
        self.assertEqual(response.data["data"]["mood_score"], 2)

    def test_mood_entries_can_be_filtered_by_exact_day(self):
        MoodEntry.objects.create(
            user=self.user,
            entry_date=date(2026, 3, 20),
            mood="calm",
            stress_level=2,
            energy_level=4,
        )
        MoodEntry.objects.create(
            user=self.user,
            entry_date=date(2026, 3, 21),
            mood="sad",
            stress_level=4,
            energy_level=2,
        )

        response = self.client.get("/api/v1/mood/?date=2026-03-20")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["entry_date"], "2026-03-20")

    def test_data_migration_maps_legacy_mood_values(self):
        entry = MoodEntry.objects.create(
            user=self.user,
            entry_date=date(2026, 3, 22),
            mood="happy",
            stress_level=3,
            energy_level=3,
        )
        MoodEntry.objects.filter(pk=entry.pk).update(mood="Mood 1")

        class FakeApps:
            @staticmethod
            def get_model(app_label, model_name):
                if (app_label, model_name) == ("mood", "MoodEntry"):
                    return MoodEntry
                raise LookupError(model_name)

        normalize_mood_values(FakeApps(), None)
        entry.refresh_from_db()
        self.assertEqual(entry.mood, "happy")
