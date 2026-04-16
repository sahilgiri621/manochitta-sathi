from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import DatabaseError, transaction
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.profiles.models import UserProfile
from apps.resources.models import Category, Resource
from apps.therapists.models import TherapistAvailability, TherapistProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Seed stable test data for local development."

    def _upsert_user(self, *, email, password, defaults):
        user, _ = User.objects.get_or_create(email=email, defaults=defaults)
        for field, value in defaults.items():
            setattr(user, field, value)
        user.set_password(password)
        user.save()
        return user

    def _upsert_profile(self, user, defaults):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        for field, value in defaults.items():
            setattr(profile, field, value)
        profile.save()
        return profile

    def _upsert_therapist_user(
        self,
        *,
        email,
        password,
        first_name,
        last_name,
        phone,
        age,
        gender,
        wellbeing_goals,
        profile_bio,
        specialization,
        therapist_bio,
        qualifications,
        experience_years,
        license_number,
        consultation_fee,
        languages,
        approval_status,
        approved_by=None,
        approved_at=None,
    ):
        therapist_user = self._upsert_user(
            email=email,
            password=password,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": User.ROLE_THERAPIST,
                "phone": phone,
                "is_email_verified": True,
            },
        )
        self._upsert_profile(
            therapist_user,
            {
                "age": age,
                "gender": gender,
                "wellbeing_goals": wellbeing_goals,
                "bio": profile_bio,
            },
        )

        therapist_profile, _ = TherapistProfile.objects.get_or_create(user=therapist_user)
        therapist_profile.specialization = specialization
        therapist_profile.bio = therapist_bio
        therapist_profile.qualifications = qualifications
        therapist_profile.experience_years = experience_years
        therapist_profile.license_number = license_number
        therapist_profile.approval_status = approval_status
        therapist_profile.approved_by = approved_by
        therapist_profile.approved_at = approved_at
        therapist_profile.consultation_fee = consultation_fee
        therapist_profile.languages = languages
        therapist_profile.save()
        return therapist_user, therapist_profile

    @transaction.atomic
    def _seed_core_data(self):
        admin = self._upsert_user(
            email="admin@test.com",
            password="admin123",
            defaults={
                "first_name": "System",
                "last_name": "Admin",
                "role": User.ROLE_ADMIN,
                "phone": "9800001000",
                "is_staff": True,
                "is_superuser": True,
                "is_email_verified": True,
            },
        )
        self._upsert_profile(
            admin,
            {
                "age": 35,
                "gender": "prefer_not_to_say",
                "wellbeing_goals": "Review therapist applications and system health.",
                "bio": "Local development administrator account.",
            },
        )

        normal_user = self._upsert_user(
            email="user@test.com",
            password="user12345",
            defaults={
                "first_name": "Sita",
                "last_name": "Basnet",
                "role": User.ROLE_USER,
                "phone": "9800001001",
                "is_email_verified": True,
            },
        )
        self._upsert_profile(
            normal_user,
            {
                "age": 24,
                "gender": "female",
                "wellbeing_goals": "Manage stress and improve sleep.",
                "bio": "Test user for end-to-end validation.",
            },
        )

        _therapist_user, therapist_profile = self._upsert_therapist_user(
            email="therapist@test.com",
            password="therapist123",
            first_name="Asha",
            last_name="Shrestha",
            phone="9800001002",
            age=32,
            gender="female",
            wellbeing_goals="Support young adults dealing with anxiety.",
            profile_bio="Licensed therapist available for stress and anxiety support.",
            specialization="Stress Management",
            therapist_bio="Supports clients with stress, anxiety, and burnout recovery.",
            qualifications="MPhil Clinical Psychology",
            experience_years=7,
            license_number="T-2026-0001",
            consultation_fee=2500,
            languages="Nepali, English",
            approval_status=TherapistProfile.STATUS_APPROVED,
            approved_by=admin,
            approved_at=timezone.now(),
        )

        self._upsert_therapist_user(
            email="pending.therapist1@test.com",
            password="therapist123",
            first_name="Nirmala",
            last_name="Karki",
            phone="9800001003",
            age=29,
            gender="female",
            wellbeing_goals="Help working adults manage burnout.",
            profile_bio="Therapist applicant focused on burnout recovery.",
            specialization="Burnout Recovery",
            therapist_bio="Works with clients experiencing work stress and emotional exhaustion.",
            qualifications="MA Counseling Psychology",
            experience_years=4,
            license_number="P-2026-0002",
            consultation_fee=2200,
            languages="Nepali, English, Hindi",
            approval_status=TherapistProfile.STATUS_PENDING,
        )
        self._upsert_therapist_user(
            email="pending.therapist2@test.com",
            password="therapist123",
            first_name="Rabin",
            last_name="Thapa",
            phone="9800001004",
            age=35,
            gender="male",
            wellbeing_goals="Support families and young adults.",
            profile_bio="Therapist applicant with family counseling experience.",
            specialization="Family Counseling",
            therapist_bio="Supports relationship issues, family stress, and adolescent wellbeing.",
            qualifications="MSc Clinical Psychology",
            experience_years=8,
            license_number="P-2026-0003",
            consultation_fee=2800,
            languages="Nepali, English",
            approval_status=TherapistProfile.STATUS_PENDING,
        )
        self._upsert_therapist_user(
            email="pending.therapist3@test.com",
            password="therapist123",
            first_name="Mina",
            last_name="Lama",
            phone="9800001005",
            age=31,
            gender="female",
            wellbeing_goals="Provide trauma-informed care to women and teens.",
            profile_bio="Therapist applicant with trauma-informed practice.",
            specialization="Trauma Support",
            therapist_bio="Focuses on trauma recovery, anxiety, and emotional regulation.",
            qualifications="PG Diploma in Psychotherapy",
            experience_years=6,
            license_number="P-2026-0004",
            consultation_fee=2600,
            languages="English, Nepali",
            approval_status=TherapistProfile.STATUS_PENDING,
        )

        stress_category, _ = Category.objects.get_or_create(
            name="Stress Management",
            defaults={"description": "Resources and guidance for managing daily stress."},
        )
        stress_category.description = "Resources and guidance for managing daily stress."
        stress_category.save()

        resource, _ = Resource.objects.get_or_create(
            title="Breathing Techniques for Stress",
            defaults={
                "category": stress_category,
                "summary": "Simple grounding techniques for stressful moments.",
                "content": "Practice paced breathing, name five things you can see, and take short breaks.",
                "format": Resource.FORMAT_ARTICLE,
                "published": True,
                "created_by": admin,
            },
        )
        resource.category = stress_category
        resource.summary = "Simple grounding techniques for stressful moments."
        resource.content = "Practice paced breathing, name five things you can see, and take short breaks."
        resource.format = Resource.FORMAT_ARTICLE
        resource.published = True
        resource.created_by = admin
        resource.save()

        slot_start = (timezone.now() + timedelta(days=1)).replace(minute=0, second=0, microsecond=0)
        availability, _ = TherapistAvailability.objects.get_or_create(
            therapist=therapist_profile,
            start_time=slot_start,
            defaults={"end_time": slot_start + timedelta(minutes=50), "is_available": True},
        )
        availability.end_time = slot_start + timedelta(minutes=50)
        availability.is_available = True
        availability.save()

        return {
            "admin": admin,
            "normal_user": normal_user,
            "therapist_profile": therapist_profile,
            "availability": availability,
        }

    def _seed_appointment(self, *, normal_user, therapist_profile, availability):
        appointment, _ = Appointment.objects.get_or_create(
            user=normal_user,
            therapist=therapist_profile,
            scheduled_start=availability.start_time,
            defaults={
                "availability_slot": availability,
                "scheduled_end": availability.end_time,
                "session_type": Appointment.TYPE_VIDEO,
                "status": Appointment.STATUS_PENDING,
                "notes": "Discuss coping strategies for work stress.",
            },
        )
        appointment.availability_slot = availability
        appointment.scheduled_end = availability.end_time
        appointment.session_type = Appointment.TYPE_VIDEO
        appointment.status = Appointment.STATUS_PENDING
        appointment.notes = "Discuss coping strategies for work stress."
        appointment.save()

    def handle(self, *args, **options):
        seeded = self._seed_core_data()
        appointment_warning = None
        try:
            with transaction.atomic():
                self._seed_appointment(
                    normal_user=seeded["normal_user"],
                    therapist_profile=seeded["therapist_profile"],
                    availability=seeded["availability"],
                )
        except DatabaseError as exc:
            appointment_warning = str(exc)

        if appointment_warning:
            self.stdout.write(
                self.style.WARNING(
                    f"Core seed data created, but appointment seeding was skipped due to a database error: {appointment_warning}"
                )
            )
        self.stdout.write(self.style.SUCCESS("Seeded admin, user, therapist, category, resource, availability, and appointment test data."))
