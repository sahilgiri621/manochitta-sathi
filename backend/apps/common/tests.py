from django.core.management import call_command
from django.test import TestCase

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.profiles.models import UserProfile
from apps.resources.models import Category, Resource
from apps.therapists.models import TherapistAvailability, TherapistProfile


class SeedSampleDataCommandTests(TestCase):
    def test_seed_command_is_idempotent_and_creates_expected_records(self):
        call_command("seed_sample_data")
        call_command("seed_sample_data")

        admin = User.objects.get(email="admin@test.com")
        self.assertTrue(admin.check_password("admin123"))
        self.assertEqual(admin.role, User.ROLE_ADMIN)

        normal_user = User.objects.get(email="user@test.com")
        self.assertTrue(normal_user.check_password("user12345"))
        normal_profile = UserProfile.objects.get(user=normal_user)
        self.assertEqual(normal_profile.age, 24)
        self.assertEqual(normal_profile.gender, "female")

        therapist_user = User.objects.get(email="therapist@test.com")
        self.assertTrue(therapist_user.check_password("therapist123"))
        therapist_profile = TherapistProfile.objects.get(user=therapist_user)
        self.assertEqual(therapist_profile.approval_status, TherapistProfile.STATUS_APPROVED)
        self.assertEqual(therapist_profile.specialization, "Stress Management")

        category = Category.objects.get(name="Stress Management")
        resource = Resource.objects.get(title="Breathing Techniques for Stress")
        appointment = Appointment.objects.get(user=normal_user, therapist=therapist_profile)

        self.assertEqual(resource.category, category)
        self.assertEqual(appointment.availability_slot.therapist, therapist_profile)

        self.assertEqual(User.objects.filter(email="admin@test.com").count(), 1)
        self.assertEqual(User.objects.filter(email="user@test.com").count(), 1)
        self.assertEqual(User.objects.filter(email="therapist@test.com").count(), 1)
        self.assertEqual(TherapistAvailability.objects.filter(therapist=therapist_profile).count(), 1)


class PublicPlatformStatsTests(TestCase):
    def test_public_stats_count_completed_paid_sessions_approved_therapists_and_people_helped(self):
        user = User.objects.create_user(
            email="stats-user@example.com",
            password="UserPass123!",
            first_name="Stats",
            role=User.ROLE_USER,
            is_email_verified=True,
        )
        second_user = User.objects.create_user(
            email="stats-user-two@example.com",
            password="UserPass123!",
            first_name="Stats",
            last_name="Two",
            role=User.ROLE_USER,
            is_email_verified=True,
        )
        therapist_user = User.objects.create_user(
            email="stats-therapist@example.com",
            password="Therapist123!",
            first_name="Therapist",
            role=User.ROLE_THERAPIST,
            is_email_verified=True,
        )
        pending_therapist_user = User.objects.create_user(
            email="pending-therapist@example.com",
            password="Therapist123!",
            first_name="Pending",
            role=User.ROLE_THERAPIST,
            is_email_verified=True,
        )
        therapist_profile = TherapistProfile.objects.get(user=therapist_user)
        therapist_profile.approval_status = TherapistProfile.STATUS_APPROVED
        therapist_profile.save(update_fields=["approval_status", "updated_at"])
        TherapistProfile.objects.get(user=pending_therapist_user)

        appointment_kwargs = {
            "therapist": therapist_profile,
            "session_type": Appointment.TYPE_VIDEO,
            "scheduled_start": "2099-01-01T10:00:00Z",
            "scheduled_end": "2099-01-01T10:50:00Z",
        }
        Appointment.objects.create(
            user=user,
            status=Appointment.STATUS_COMPLETED,
            payment_status=Appointment.PAYMENT_PAID,
            **appointment_kwargs,
        )
        Appointment.objects.create(
            user=user,
            status=Appointment.STATUS_COMPLETED,
            payment_status=Appointment.PAYMENT_PAID,
            scheduled_start="2099-01-02T10:00:00Z",
            scheduled_end="2099-01-02T10:50:00Z",
            therapist=therapist_profile,
            session_type=Appointment.TYPE_VIDEO,
        )
        Appointment.objects.create(
            user=second_user,
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID,
            scheduled_start="2099-01-03T10:00:00Z",
            scheduled_end="2099-01-03T10:50:00Z",
            therapist=therapist_profile,
            session_type=Appointment.TYPE_VIDEO,
        )

        response = self.client.get("/api/v1/public/stats/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["sessions_completed"], 2)
        self.assertEqual(response.data["data"]["therapists_available"], 1)
        self.assertEqual(response.data["data"]["people_helped"], 1)
        self.assertEqual(response.data["data"]["community_members"], 4)
