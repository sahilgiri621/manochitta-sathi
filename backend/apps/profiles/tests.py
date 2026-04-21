from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.therapists.models import TherapistProfile

User = get_user_model()


class AssignedPatientProfileApiTests(APITestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            email="assigned-patient@example.com",
            password="UserPass123!",
            first_name="Assigned",
            last_name="Patient",
            phone="9800000001",
            role=User.ROLE_USER,
            is_email_verified=True,
        )
        self.patient.profile.age = 31
        self.patient.profile.gender = "female"
        self.patient.profile.wellbeing_goals = "Manage anxiety"
        self.patient.profile.bio = "Prefers evening sessions."
        self.patient.profile.address = "Kathmandu"
        self.patient.profile.emergency_contact_name = "Family Contact"
        self.patient.profile.emergency_contact_phone = "9800000002"
        self.patient.profile.save()

        self.other_patient = User.objects.create_user(
            email="other-patient@example.com",
            password="UserPass123!",
            first_name="Other",
            role=User.ROLE_USER,
            is_email_verified=True,
        )
        self.therapist_user = User.objects.create_user(
            email="profile-therapist@example.com",
            password="Therapist123!",
            first_name="Therapist",
            role=User.ROLE_THERAPIST,
            is_email_verified=True,
        )
        self.other_therapist_user = User.objects.create_user(
            email="profile-other-therapist@example.com",
            password="Therapist123!",
            first_name="Other Therapist",
            role=User.ROLE_THERAPIST,
            is_email_verified=True,
        )
        self.therapist = TherapistProfile.objects.get(user=self.therapist_user)
        self.other_therapist = TherapistProfile.objects.get(user=self.other_therapist_user)
        self.therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.other_therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist.save(update_fields=["approval_status"])
        self.other_therapist.save(update_fields=["approval_status"])

        Appointment.objects.create(
            user=self.patient,
            therapist=self.therapist,
            session_type=Appointment.TYPE_VIDEO,
            scheduled_start=timezone.now() + timedelta(days=2),
            scheduled_end=timezone.now() + timedelta(days=2, minutes=50),
            status=Appointment.STATUS_CONFIRMED,
        )
        Appointment.objects.create(
            user=self.other_patient,
            therapist=self.other_therapist,
            session_type=Appointment.TYPE_VIDEO,
            scheduled_start=timezone.now() + timedelta(days=3),
            scheduled_end=timezone.now() + timedelta(days=3, minutes=50),
            status=Appointment.STATUS_CONFIRMED,
        )

    def authenticate(self, email, password):
        login = self.client.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    def test_therapist_can_view_assigned_patient_profile(self):
        self.authenticate(self.therapist_user.email, "Therapist123!")

        response = self.client.get("/api/v1/profiles/patients/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.patient.id)
        self.assertEqual(results[0]["name"], "Assigned Patient")
        self.assertEqual(results[0]["email"], "assigned-patient@example.com")
        self.assertEqual(results[0]["age"], 31)
        self.assertEqual(results[0]["gender"], "female")
        self.assertEqual(results[0]["wellbeing_goals"], "Manage anxiety")
        self.assertEqual(results[0]["emergency_contact_name"], "Family Contact")

    def test_regular_user_cannot_view_assigned_patient_profiles(self):
        self.authenticate(self.patient.email, "UserPass123!")

        response = self.client.get("/api/v1/profiles/patients/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
