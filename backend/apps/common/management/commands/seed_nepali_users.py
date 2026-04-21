from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.profiles.models import UserProfile

User = get_user_model()

DEFAULT_PASSWORD = "NepaliUser@123"

SEED_USERS = [
    {
        "first_name": "Aarati",
        "last_name": "Shrestha",
        "gender": "female",
        "age": 24,
        "city": "Kathmandu",
        "district": "Kathmandu",
        "goals": "Manage work stress and improve sleep routine.",
        "email_name": "himali.sathi274",
    },
    {
        "first_name": "Bikash",
        "last_name": "Adhikari",
        "gender": "male",
        "age": 29,
        "city": "Pokhara",
        "district": "Kaski",
        "goals": "Build confidence and manage social anxiety.",
        "email_name": "bikashpokharel81",
    },
    {
        "first_name": "Srijana",
        "last_name": "Rai",
        "gender": "female",
        "age": 31,
        "city": "Dharan",
        "district": "Sunsari",
        "goals": "Learn coping skills for emotional regulation.",
        "email_name": "srijana.rai509",
    },
    {
        "first_name": "Nabin",
        "last_name": "Gurung",
        "gender": "male",
        "age": 27,
        "city": "Besisahar",
        "district": "Lamjung",
        "goals": "Reduce burnout and maintain healthier routines.",
        "email_name": "nabingurung.lmj42",
    },
    {
        "first_name": "Anisha",
        "last_name": "Karki",
        "gender": "female",
        "age": 22,
        "city": "Biratnagar",
        "district": "Morang",
        "goals": "Handle exam pressure and improve focus.",
        "email_name": "anisha.karki733",
    },
    {
        "first_name": "Roshan",
        "last_name": "Thapa",
        "gender": "male",
        "age": 34,
        "city": "Butwal",
        "district": "Rupandehi",
        "goals": "Process grief and rebuild daily motivation.",
        "email_name": "roshan.thapa216",
    },
    {
        "first_name": "Menuka",
        "last_name": "Tamang",
        "gender": "female",
        "age": 28,
        "city": "Dhulikhel",
        "district": "Kavrepalanchok",
        "goals": "Improve communication and reduce family stress.",
        "email_name": "menuka.tamang64",
    },
    {
        "first_name": "Suman",
        "last_name": "Poudel",
        "gender": "male",
        "age": 26,
        "city": "Bharatpur",
        "district": "Chitwan",
        "goals": "Manage panic symptoms and sleep better.",
        "email_name": "suman.ctw908",
    },
    {
        "first_name": "Pratiksha",
        "last_name": "Lama",
        "gender": "female",
        "age": 30,
        "city": "Hetauda",
        "district": "Makwanpur",
        "goals": "Work through trauma symptoms with steady support.",
        "email_name": "pratiksha.lama357",
    },
    {
        "first_name": "Kiran",
        "last_name": "KC",
        "gender": "male",
        "age": 25,
        "city": "Tulsipur",
        "district": "Dang",
        "goals": "Build emotional awareness and manage anger.",
        "email_name": "kiran.kc182",
    },
    {
        "first_name": "Laxmi",
        "last_name": "Bhandari",
        "gender": "female",
        "age": 37,
        "city": "Nepalgunj",
        "district": "Banke",
        "goals": "Find balance between parenting and work pressure.",
        "email_name": "laxmi.bhandari720",
    },
    {
        "first_name": "Dipesh",
        "last_name": "Maharjan",
        "gender": "male",
        "age": 33,
        "city": "Lalitpur",
        "district": "Lalitpur",
        "goals": "Manage low mood and improve consistency.",
        "email_name": "dipesh.mhrjn45",
    },
    {
        "first_name": "Asmita",
        "last_name": "Dahal",
        "gender": "female",
        "age": 21,
        "city": "Damak",
        "district": "Jhapa",
        "goals": "Handle academic pressure and self-doubt.",
        "email_name": "asmita.dahal903",
    },
    {
        "first_name": "Ramesh",
        "last_name": "Yadav",
        "gender": "male",
        "age": 40,
        "city": "Janakpur",
        "district": "Dhanusha",
        "goals": "Reduce stress after a major life transition.",
        "email_name": "ramesh.yadav268",
    },
    {
        "first_name": "Puja",
        "last_name": "Chaudhary",
        "gender": "female",
        "age": 23,
        "city": "Tikapur",
        "district": "Kailali",
        "goals": "Develop coping skills for anxiety and uncertainty.",
        "email_name": "puja.chaudhary551",
    },
    {
        "first_name": "Sagar",
        "last_name": "Bista",
        "gender": "male",
        "age": 32,
        "city": "Dhangadhi",
        "district": "Kailali",
        "goals": "Improve sleep and manage financial stress.",
        "email_name": "sagar.bista407",
    },
    {
        "first_name": "Nisha",
        "last_name": "Ghimire",
        "gender": "female",
        "age": 35,
        "city": "Gorkha",
        "district": "Gorkha",
        "goals": "Process relationship stress and improve boundaries.",
        "email_name": "nisha.ghimire611",
    },
    {
        "first_name": "Milan",
        "last_name": "Magar",
        "gender": "male",
        "age": 28,
        "city": "Palpa",
        "district": "Palpa",
        "goals": "Strengthen self-esteem and routine discipline.",
        "email_name": "milan.magar293",
    },
    {
        "first_name": "Sabina",
        "last_name": "Khadka",
        "gender": "female",
        "age": 26,
        "city": "Ilam",
        "district": "Ilam",
        "goals": "Manage loneliness and improve daily mood.",
        "email_name": "sabina.khadka876",
    },
    {
        "first_name": "Aakash",
        "last_name": "Neupane",
        "gender": "male",
        "age": 24,
        "city": "Banepa",
        "district": "Kavrepalanchok",
        "goals": "Learn tools for focus, stress, and confidence.",
        "email_name": "aakash.neupane134",
    },
    {
        "first_name": "Ritika",
        "last_name": "Bhattarai",
        "gender": "female",
        "age": 29,
        "city": "Itahari",
        "district": "Sunsari",
        "goals": "Reduce health anxiety and improve coping habits.",
        "email_name": "ritika.bhattarai492",
    },
    {
        "first_name": "Prabin",
        "last_name": "Limbu",
        "gender": "male",
        "age": 36,
        "city": "Phidim",
        "district": "Panchthar",
        "goals": "Manage workplace conflict and emotional fatigue.",
        "email_name": "prabin.limbu305",
    },
    {
        "first_name": "Kalpana",
        "last_name": "Tiwari",
        "gender": "female",
        "age": 42,
        "city": "Birgunj",
        "district": "Parsa",
        "goals": "Work on stress management and family communication.",
        "email_name": "kalpana.tiwari718",
    },
    {
        "first_name": "Manoj",
        "last_name": "Sapkota",
        "gender": "male",
        "age": 31,
        "city": "Baglung",
        "district": "Baglung",
        "goals": "Recover motivation and build a healthier routine.",
        "email_name": "manoj.sapkota267",
    },
    {
        "first_name": "Sunita",
        "last_name": "Malla",
        "gender": "female",
        "age": 27,
        "city": "Bhaktapur",
        "district": "Bhaktapur",
        "goals": "Improve sleep and reduce overthinking.",
        "email_name": "sunita.malla844",
    },
]


class Command(BaseCommand):
    help = "Seed 25 fictional Nepali regular users with complete profiles for local development."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Password to set for all seeded users. Defaults to a development-only sample password.",
        )
        parser.add_argument(
            "--domain",
            default="gmail.com",
            help="Email domain for seeded users.",
        )

    def _email_for(self, item, domain):
        return f"{item['email_name']}@{domain}"

    def _legacy_email_for(self, item):
        first = item["first_name"].lower().replace(" ", "")
        last = item["last_name"].lower().replace(" ", "")
        return f"dev.{first}.{last}@example.test"

    def _phone_for(self, index):
        return f"9701002{index:03d}"

    def _emergency_phone_for(self, index):
        return f"9702002{index:03d}"

    def _profile_defaults(self, item, index):
        return {
            "age": item["age"],
            "gender": item["gender"],
            "wellbeing_goals": item["goals"],
            "bio": (
                f"Fictional development user from {item['city']}, {item['district']}. "
                "Created for Manochitta Sathi testing only."
            ),
            "address": f"{item['city']}, {item['district']}, Nepal",
            "emergency_contact_name": f"{item['last_name']} Family Contact",
            "emergency_contact_phone": self._emergency_phone_for(index),
        }

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        domain = options["domain"].strip().lower()
        created_count = 0
        updated_count = 0
        credentials = []

        for index, item in enumerate(SEED_USERS, start=1):
            email = self._email_for(item, domain)
            user_defaults = {
                "first_name": item["first_name"],
                "last_name": item["last_name"],
                "phone": self._phone_for(index),
                "role": User.ROLE_USER,
                "is_active": True,
                "is_staff": False,
                "is_superuser": False,
                "is_email_verified": True,
            }
            user = User.objects.filter(email=email).first()
            created = False
            if user is None:
                user = User.objects.filter(email=self._legacy_email_for(item)).first()
                if user is not None:
                    user.email = email
            if user is None:
                user = User.objects.create_user(email=email, password=password, **user_defaults)
                created = True
            for field, value in user_defaults.items():
                setattr(user, field, value)
            user.set_password(password)
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            for field, value in self._profile_defaults(item, index).items():
                setattr(profile, field, value)
            profile.save()

            if created:
                created_count += 1
            else:
                updated_count += 1
            credentials.append((email, password))

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(SEED_USERS)} Nepali users: {created_count} created, {updated_count} updated."
            )
        )
        self.stdout.write("Development login credentials:")
        for email, password in credentials[:10]:
            self.stdout.write(f"  {email} / {password}")
        if len(credentials) > 10:
            self.stdout.write(f"  ...and {len(credentials) - 10} more seeded users with the same password.")
