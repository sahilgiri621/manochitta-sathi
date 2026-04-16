from rest_framework.throttling import ScopedRateThrottle


class AuthRateThrottle(ScopedRateThrottle):
    scope = "auth"


class PasswordResetRateThrottle(ScopedRateThrottle):
    scope = "password_reset"
