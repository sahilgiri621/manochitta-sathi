from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from django.urls import path

from .views import (
    AdminUserManagementViewSet,
    ForgotPasswordView,
    GoogleAuthView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    ResendVerificationView,
    ResetPasswordView,
    VerifyEmailView,
)

router = DefaultRouter()
router.register("admin/users", AdminUserManagementViewSet, basename="admin-users")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("register", RegisterView.as_view()),
    path("login/", LoginView.as_view(), name="login"),
    path("login", LoginView.as_view()),
    path("google/", GoogleAuthView.as_view(), name="google-auth"),
    path("google", GoogleAuthView.as_view()),
    path("login/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("login/refresh", TokenRefreshView.as_view()),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout", LogoutView.as_view()),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("verify-email", VerifyEmailView.as_view()),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),
    path("resend-verification", ResendVerificationView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("forgot-password", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("reset-password", ResetPasswordView.as_view()),
    path("me/", MeView.as_view(), name="me"),
    path("me", MeView.as_view()),
]

urlpatterns += router.urls
