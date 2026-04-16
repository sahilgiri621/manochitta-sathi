from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.profiles.models import UserProfile
from apps.therapists.models import TherapistProfile

from .models import User


@receiver(post_save, sender=User)
def create_related_profiles(sender, instance, created, **kwargs):
    if not created:
        return
    UserProfile.objects.get_or_create(user=instance)
    if instance.role == User.ROLE_THERAPIST:
        TherapistProfile.objects.get_or_create(user=instance)
