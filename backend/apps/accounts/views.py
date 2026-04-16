import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.auditlog.models import AdminAction
from apps.common.date_filters import filter_queryset_by_date
from apps.common.permissions import IsAdminRole
from apps.common.responses import api_response
from apps.common.viewsets import WrappedModelViewSet

from .serializers import (
    AdminUserManagementSerializer,
    CustomTokenObtainPairSerializer,
    EmailVerificationSerializer,
    ForgotPasswordSerializer,
    GoogleAuthSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)
from .services import (
    build_auth_tokens,
    get_or_create_google_user,
    mark_email_verified,
    reset_password,
    send_verification_email,
    send_password_reset_email,
    update_last_seen,
    verify_google_credential,
)
from .throttles import AuthRateThrottle, PasswordResetRateThrottle

User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return api_response(
            data=UserSerializer(user).data,
            message="Registration successful.",
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            email = request.data.get("email")
            user = User.objects.filter(email=email).first()
            if user:
                update_last_seen(user)
            response.data = {
                "success": True,
                "message": "Login successful.",
                "data": response.data,
            }
        return response


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = mark_email_verified(serializer.instance)
        return api_response(data=UserSerializer(user).data, message="Email verified successfully.")


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()
        if user and not user.is_email_verified:
            send_verification_email(user)
        return api_response(message="If the account exists and is unverified, a verification email has been sent.")


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email=serializer.validated_data["email"]).first()
        if user:
            send_password_reset_email(user)
        return api_response(message="If the account exists, a reset email has been sent.")


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = reset_password(serializer.instance, serializer.validated_data["new_password"])
        return api_response(data=UserSerializer(user).data, message="Password reset successful.")


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            google_payload = verify_google_credential(serializer.validated_data["credential"])
        except ImproperlyConfigured as exc:
            return api_response(
                message=str(exc),
                success=False,
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            user, _created = get_or_create_google_user(google_payload)
            update_last_seen(user)

            return api_response(
                data={
                    **build_auth_tokens(user),
                    "user": UserSerializer(user).data,
                },
                message="Google authentication successful.",
            )
        except ValidationError:
            raise
        except Exception as exc:
            logger.exception("Google authentication failed")
            message = str(exc) if settings.DEBUG else "Google authentication failed."
            return api_response(
                message=message,
                success=False,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return api_response(message="Refresh token is required.", success=False, status_code=status.HTTP_400_BAD_REQUEST)
        try:
            from rest_framework_simplejwt.tokens import RefreshToken

            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as exc:
            raise ValidationError("Invalid refresh token.") from exc
        return api_response(message="Logout successful.")


class MeView(APIView):
    def get(self, request):
        return api_response(data=UserSerializer(request.user).data, message="User retrieved successfully.")


class AdminUserManagementViewSet(WrappedModelViewSet):
    serializer_class = AdminUserManagementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    http_method_names = ["get", "patch", "post", "head", "options"]
    search_fields = ("email", "first_name", "last_name", "phone")
    ordering_fields = ("created_at", "email", "role")

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get("role")
        is_active = self.request.query_params.get("is_active")
        queryset = filter_queryset_by_date(queryset, "created_at", self.request.query_params.get("date"))
        if role:
            queryset = queryset.filter(role=role)
        if is_active in {"true", "false"}:
            queryset = queryset.filter(is_active=(is_active == "true"))
        return queryset

    def perform_update(self, serializer):
        previous = {
            "role": serializer.instance.role,
            "is_active": serializer.instance.is_active,
            "is_email_verified": serializer.instance.is_email_verified,
            "first_name": serializer.instance.first_name,
            "last_name": serializer.instance.last_name,
            "phone": serializer.instance.phone,
        }
        user = serializer.save()
        if user.role == User.ROLE_ADMIN and not user.is_staff:
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        AdminAction.objects.create(
            admin=self.request.user,
            action="user_updated",
            target_type="user",
            target_id=str(user.id),
            details={"before": previous, "after": AdminUserManagementSerializer(user).data},
        )

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            raise ValidationError("Superusers cannot be deactivated.")
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        AdminAction.objects.create(
            admin=request.user,
            action="user_deactivated",
            target_type="user",
            target_id=str(user.id),
            details={"is_active": False},
        )
        return api_response(data=AdminUserManagementSerializer(user).data, message="User deactivated successfully.")

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active", "updated_at"])
        AdminAction.objects.create(
            admin=request.user,
            action="user_activated",
            target_type="user",
            target_id=str(user.id),
            details={"is_active": True},
        )
        return api_response(data=AdminUserManagementSerializer(user).data, message="User activated successfully.")
