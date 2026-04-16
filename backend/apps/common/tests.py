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
