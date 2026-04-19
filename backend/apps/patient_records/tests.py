from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.therapists.models import TherapistProfile

from .models import PatientRecord

User = get_user_model()


class PatientRecordApiTests(APITestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            email="record-patient@example.com",
            password="UserPass123!",
            first_name="Patient",
            role="user",
            is_email_verified=True,
        )
        self.other_patient = User.objects.create_user(
            email="record-other-patient@example.com",
            password="UserPass123!",
            first_name="Other Patient",
            role="user",
            is_email_verified=True,
        )
        self.therapist_user = User.objects.create_user(
            email="record-therapist@example.com",
            password="Therapist123!",
            first_name="Therapist",
            role="therapist",
            is_email_verified=True,
        )
        self.other_therapist_user = User.objects.create_user(
            email="record-other-therapist@example.com",
            password="Therapist123!",
            first_name="Other Therapist",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist = TherapistProfile.objects.get(user=self.therapist_user)
        self.other_therapist = TherapistProfile.objects.get(user=self.other_therapist_user)
        self.therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.other_therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist.save(update_fields=["approval_status"])
        self.other_therapist.save(update_fields=["approval_status"])
        self.appointment = Appointment.objects.create(
            user=self.patient,
            therapist=self.therapist,
            session_type="video",
            scheduled_start=timezone.now() + timedelta(days=2),
            scheduled_end=timezone.now() + timedelta(days=2, minutes=50),
            status=Appointment.STATUS_CONFIRMED,
        )
        self.record = PatientRecord.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            appointment=self.appointment,
            notes="Initial session notes.",
            recommendations="Breathing practice.",
        )

    def authenticate(self, email, password):
        login = self.client.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    def test_therapist_can_create_and_update_assigned_patient_record(self):
        self.authenticate(self.therapist_user.email, "Therapist123!")

        create_response = self.client.post(
            "/api/v1/patient-records/",
            {
                "patient": self.patient.id,
                "appointment": self.appointment.id,
                "notes": "Updated observations.",
                "diagnosis_notes": "Stress-related symptoms.",
                "recommendations": "Keep sleep log.",
                "session_summary": "Patient engaged well.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        record_id = create_response.data["data"]["id"]
        update_response = self.client.patch(
            f"/api/v1/patient-records/{record_id}/",
            {"notes": "Follow-up observations."},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["data"]["notes"], "Follow-up observations.")

    def test_other_therapist_cannot_modify_record(self):
        self.authenticate(self.other_therapist_user.email, "Therapist123!")

        response = self.client.patch(
            f"/api/v1/patient-records/{self.record.id}/",
            {"notes": "Unauthorized edit."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patient_can_view_only_own_records(self):
        PatientRecord.objects.create(
            patient=self.other_patient,
            therapist=self.therapist,
            notes="Other patient record.",
        )
        self.authenticate(self.patient.email, "UserPass123!")

        response = self.client.get("/api/v1/patient-records/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["patient"], self.patient.id)

    def test_patient_cannot_create_record(self):
        self.authenticate(self.patient.email, "UserPass123!")

        response = self.client.post(
            "/api/v1/patient-records/",
            {
                "patient": self.patient.id,
                "notes": "Patient should not create records.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
