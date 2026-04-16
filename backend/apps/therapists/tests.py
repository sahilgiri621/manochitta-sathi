from datetime import timedelta
from django.core.files.uploadedfile import SimpleUploadedFile

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.feedback.models import Feedback
from apps.profiles.models import UserProfile
from .models import TherapistAvailability, TherapistClinic, TherapistProfile

User = get_user_model()
PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc````\x00"
    b"\x00\x00\x05\x00\x01\xa5\xf6E@\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TherapistApiTests(APITestCase):
    def setUp(self):
        self.therapist_user = User.objects.create_user(
            email="therapist-test@example.com",
            password="Therapist123!",
            first_name="Therapist",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist_profile = TherapistProfile.objects.get(user=self.therapist_user)
        self.therapist_profile.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist_profile.specialization = "Anxiety"
        self.therapist_profile.save(update_fields=["approval_status", "specialization"])
        TherapistAvailability.objects.create(
            therapist=self.therapist_profile,
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, minutes=50),
        )

    def test_public_listing_returns_approved_therapists_only(self):
        User.objects.create_user(
            email="pending-therapist@example.com",
            password="PendingPass123!",
            first_name="Pending",
            role="therapist",
            is_email_verified=True,
        )
        response = self.client.get("/api/v1/therapists/profiles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["user"]["email"], self.therapist_user.email)

    def test_public_root_listing_alias_returns_approved_therapists_only(self):
        response = self.client.get("/api/v1/therapists/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["user"]["email"], self.therapist_user.email)

    def test_public_root_detail_alias_returns_approved_therapist(self):
        response = self.client.get(f"/api/v1/therapists/{self.therapist_profile.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["user"]["email"], self.therapist_user.email)

    def test_public_therapist_application_creates_user_profile_and_therapist_profile(self):
        response = self.client.post(
            "/api/v1/therapists/apply/",
            {
                "first_name": "Asha",
                "last_name": "Karki",
                "email": "apply-therapist@example.com",
                "phone": "9800000011",
                "password": "Therapist123!",
                "age": 34,
                "gender": "female",
                "specialization": "Trauma Therapy",
                "qualifications": "MPhil Clinical Psychology",
                "experience_years": 8,
                "license_number": "LIC-200",
                "consultation_fee": 3200,
                "languages": "English, Nepali",
                "bio": "Experienced therapist",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="apply-therapist@example.com")
        profile = UserProfile.objects.get(user=user)
        therapist = TherapistProfile.objects.get(user=user)
        self.assertEqual(user.role, "therapist")
        self.assertEqual(profile.age, 34)
        self.assertEqual(profile.gender, "female")
        self.assertEqual(therapist.specialization, "Trauma Therapy")
        self.assertEqual(therapist.approval_status, TherapistProfile.STATUS_PENDING)

    def test_duplicate_therapist_application_is_rejected_cleanly(self):
        payload = {
            "first_name": "Asha",
            "last_name": "Karki",
            "email": "duplicate-therapist@example.com",
            "password": "Therapist123!",
            "age": 34,
            "gender": "female",
            "specialization": "Trauma Therapy",
            "license_number": "LIC-201",
        }
        first = self.client.post("/api/v1/therapists/apply/", payload, format="json")
        second = self.client.post("/api/v1/therapists/apply/", payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_therapist_can_view_and_update_own_profile(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist_user.email, "password": "Therapist123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.patch(
            "/api/v1/therapists/profiles/me/",
            {"languages": "Nepali, English", "consultation_fee": 3500},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.therapist_profile.refresh_from_db()
        self.assertEqual(self.therapist_profile.consultation_fee, 3500)
        self.assertIn("English", self.therapist_profile.languages)

    def test_therapist_can_upload_profile_image(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist_user.email, "password": "Therapist123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.patch(
            "/api/v1/therapists/profiles/me/",
            {"profile_image": SimpleUploadedFile("headshot.png", PNG_1X1, content_type="image/png")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.therapist_profile.refresh_from_db()
        self.assertTrue(bool(self.therapist_profile.profile_image))
        self.assertIn("/media/therapists/", response.data["data"]["profile_image_url"])

    def test_therapist_cannot_create_overlapping_availability_slots(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist_user.email, "password": "Therapist123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        existing_slot = self.therapist_profile.availability_slots.first()
        response = self.client.post(
            "/api/v1/therapists/availability/",
            {
                "start_time": existing_slot.start_time.isoformat(),
                "end_time": (existing_slot.end_time + timedelta(minutes=10)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("overlaps", str(response.data["message"]).lower())

    def test_public_availability_only_returns_open_future_slots(self):
        public_slot = self.therapist_profile.availability_slots.order_by("start_time").last()
        past_slot = TherapistAvailability.objects.create(
            therapist=self.therapist_profile,
            start_time=timezone.now() - timedelta(days=1),
            end_time=timezone.now() - timedelta(days=1, minutes=-30),
        )
        unavailable_slot = TherapistAvailability.objects.create(
            therapist=self.therapist_profile,
            start_time=timezone.now() + timedelta(days=3),
            end_time=timezone.now() + timedelta(days=3, minutes=30),
            is_available=False,
        )
        response = self.client.get(f"/api/v1/therapists/availability/?therapist={self.therapist_profile.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        returned_ids = {item["id"] for item in results}
        self.assertIn(public_slot.id, returned_ids)
        self.assertNotIn(past_slot.id, returned_ids)
        self.assertNotIn(unavailable_slot.id, returned_ids)

    def test_admin_can_filter_therapist_applications_by_created_day(self):
        pending_user = User.objects.create_user(
            email="dated-pending@example.com",
            password="PendingPass123!",
            first_name="Dated",
            role="therapist",
            is_email_verified=True,
        )
        pending_profile = TherapistProfile.objects.get(user=pending_user)
        TherapistProfile.objects.filter(pk=pending_profile.pk).update(created_at=timezone.now() - timedelta(days=3))
        pending_profile.refresh_from_db()

        admin = User.objects.create_user(
            email="therapist-admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": admin.email, "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

        selected_date = timezone.localtime(pending_profile.created_at).date().isoformat()
        response = self.client.get(f"/api/v1/therapists/profiles/?date={selected_date}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        returned_ids = {item["id"] for item in results}
        self.assertIn(pending_profile.id, returned_ids)
        self.assertNotIn(self.therapist_profile.id, returned_ids)

    def test_therapist_can_create_and_update_own_clinic(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.therapist_user.email, "password": "Therapist123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

        create_response = self.client.put(
            "/api/v1/therapists/profiles/me/clinic/",
            {
                "clinic_name": "Calm Space Clinic",
                "clinic_address": "Putalisadak, Kathmandu",
                "latitude": "27.710300",
                "longitude": "85.322200",
                "phone": "9800001234",
                "opening_hours": "Sun-Fri, 9 AM - 5 PM",
                "notes": "Second floor, near the main road.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_200_OK)
        self.assertEqual(create_response.data["data"]["clinic_name"], "Calm Space Clinic")

        update_response = self.client.patch(
            "/api/v1/therapists/profiles/me/clinic/",
            {
                "opening_hours": "Sun-Fri, 10 AM - 6 PM",
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["data"]["opening_hours"], "Sun-Fri, 10 AM - 6 PM")

    def test_non_therapist_cannot_edit_therapist_clinic(self):
        user = User.objects.create_user(
            email="clinic-user@example.com",
            password="UserPass123!",
            first_name="Clinic User",
            role="user",
            is_email_verified=True,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "UserPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

        response = self.client.put(
            "/api/v1/therapists/profiles/me/clinic/",
            {
                "clinic_name": "Unauthorized Clinic",
                "clinic_address": "Somewhere",
                "latitude": "27.717200",
                "longitude": "85.324000",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_therapist_detail_returns_clinic_info_when_present(self):
        TherapistClinic.objects.create(
            therapist=self.therapist_profile,
            clinic_name="Calm Space Clinic",
            clinic_address="Putalisadak, Kathmandu",
            latitude="27.710300",
            longitude="85.322200",
            opening_hours="Sun-Fri, 9 AM - 5 PM",
        )

        response = self.client.get(f"/api/v1/therapists/{self.therapist_profile.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["clinic"]["clinic_name"], "Calm Space Clinic")

    def test_public_listing_includes_feedback_rating_summary(self):
        patient = User.objects.create_user(
            email="therapist-rating-user@example.com",
            password="UserPass123!",
            first_name="Rating",
            role="user",
            is_email_verified=True,
        )
        appointment = Appointment.objects.create(
            user=patient,
            therapist=self.therapist_profile,
            session_type="video",
            scheduled_start=timezone.now() + timedelta(days=5),
            scheduled_end=timezone.now() + timedelta(days=5, minutes=50),
            status=Appointment.STATUS_COMPLETED,
        )
        Feedback.objects.create(
            appointment=appointment,
            user=patient,
            therapist=self.therapist_profile,
            rating=4,
            comment="Helpful support.",
        )

        response = self.client.get(f"/api/v1/therapists/{self.therapist_profile.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["review_count"], 1)
        self.assertEqual(response.data["data"]["rating"], 4.0)
