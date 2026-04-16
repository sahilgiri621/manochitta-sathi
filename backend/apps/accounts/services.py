from importlib import import_module

from django.conf import settings
from django.core.mail import send_mail
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.notifications.models import Notification

from .models import EmailVerificationToken, PasswordResetToken, User


def send_verification_email(user):
    token = EmailVerificationToken.build_for_user(user)
    verification_url = f"{settings.FRONTEND_BASE_URL}/verify-email?token={token.token}"
    send_mail(
        subject="Verify your Manochitta Sathi email",
        message=f"Welcome to Manochitta Sathi. Verify your email using this link: {verification_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return token


def send_password_reset_email(user):
    token = PasswordResetToken.build_for_user(user)
    reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token.token}"
    send_mail(
        subject="Reset your Manochitta Sathi password",
        message=f"Reset your password using this link: {reset_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return token


def mark_email_verified(token):
    token.is_used = True
    token.save(update_fields=["is_used", "updated_at"])
    user = token.user
    user.is_email_verified = True
    user.save(update_fields=["is_email_verified", "updated_at"])
    Notification.objects.create(
        user=user,
        title="Email verified",
        message="Your email address has been verified successfully.",
        notification_type=Notification.TYPE_GENERAL,
    )
    return user


def reset_password(token, new_password):
    user = token.user
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    token.is_used = True
    token.save(update_fields=["is_used", "updated_at"])
    return user


def update_last_seen(user):
    user.last_seen_at = timezone.now()
    user.save(update_fields=["last_seen_at"])


def build_auth_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["email"] = user.email
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def verify_google_credential(credential):
    if not settings.GOOGLE_CLIENT_ID:
        raise ImproperlyConfigured("GOOGLE_CLIENT_ID is not configured.")

    try:
        google_id_token = import_module("google.oauth2.id_token")
        google_requests = import_module("google.auth.transport.requests")
    except ModuleNotFoundError as exc:
        raise ImproperlyConfigured("google-auth must be installed to enable Google sign-in.") from exc

    try:
        payload = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception as exc:
        raise ValidationError("Invalid Google credential.") from exc

    if payload.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise ValidationError("Invalid Google token issuer.")

    if not payload.get("email"):
        raise ValidationError("Google account did not provide an email address.")

    if not payload.get("email_verified"):
        raise ValidationError("Google account email must be verified.")

    if not payload.get("sub"):
        raise ValidationError("Google account did not provide a subject identifier.")

    return payload


def get_or_create_google_user(google_payload):
    email = User.objects.normalize_email(google_payload.get("email", ""))
    google_sub = google_payload.get("sub")
    given_name = (google_payload.get("given_name") or "").strip()
    family_name = (google_payload.get("family_name") or "").strip()
    full_name = (google_payload.get("name") or "").strip()

    user = User.objects.filter(google_sub=google_sub).first()
    if user:
        return user, False

    user = User.objects.filter(email__iexact=email).first()
    if user:
        if user.google_sub and user.google_sub != google_sub:
            raise ValidationError("This email is already linked to a different Google account.")

        updated_fields = []
        if user.google_sub != google_sub:
            user.google_sub = google_sub
            updated_fields.append("google_sub")
        if not user.first_name:
            user.first_name = given_name or full_name or user.email.split("@")[0]
            updated_fields.append("first_name")
        if not user.last_name and family_name:
            user.last_name = family_name
            updated_fields.append("last_name")
        if not user.is_email_verified:
            user.is_email_verified = True
            updated_fields.append("is_email_verified")
        if updated_fields:
            updated_fields.append("updated_at")
            user.save(update_fields=updated_fields)
        return user, False

    user = User(
        email=email,
        google_sub=google_sub,
        first_name=given_name or full_name or email.split("@")[0],
        last_name=family_name,
        role=User.ROLE_USER,
        is_email_verified=True,
    )
    user.set_unusable_password()
    user.save()
    return user, True
