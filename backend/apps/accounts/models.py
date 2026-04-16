import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    ROLE_USER = "user"
    ROLE_THERAPIST = "therapist"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = (
        (ROLE_USER, "User"),
        (ROLE_THERAPIST, "Therapist"),
        (ROLE_ADMIN, "Admin"),
    )

    email = models.EmailField(unique=True)
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["google_sub"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class OneTimeToken(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="%(class)ss")
    token = models.CharField(max_length=128, unique=True, default=secrets.token_urlsafe)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        abstract = True
        ordering = ("-created_at",)

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at


class EmailVerificationToken(OneTimeToken):
    class Meta(OneTimeToken.Meta):
        verbose_name = "Email verification token"
        verbose_name_plural = "Email verification tokens"

    @classmethod
    def build_for_user(cls, user):
        return cls.objects.create(user=user, expires_at=timezone.now() + timedelta(hours=24))


class PasswordResetToken(OneTimeToken):
    class Meta(OneTimeToken.Meta):
        verbose_name = "Password reset token"
        verbose_name_plural = "Password reset tokens"

    @classmethod
    def build_for_user(cls, user):
        return cls.objects.create(user=user, expires_at=timezone.now() + timedelta(hours=2))
