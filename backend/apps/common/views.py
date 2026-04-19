from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.therapists.models import TherapistProfile


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "success": True,
                "message": "Backend is healthy.",
                "data": {"service": "manochitta-sathi-api"},
            }
        )


class PublicPlatformStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        completed_paid_sessions = Appointment.objects.filter(
            status=Appointment.STATUS_COMPLETED,
            payment_status=Appointment.PAYMENT_PAID,
        )
        return Response(
            {
                "success": True,
                "message": "Platform statistics retrieved successfully.",
                "data": {
                    "sessions_completed": completed_paid_sessions.count(),
                    "therapists_available": TherapistProfile.objects.filter(
                        approval_status=TherapistProfile.STATUS_APPROVED,
                    ).count(),
                    "people_helped": completed_paid_sessions.values("user_id").distinct().count(),
                    "community_members": User.objects.filter(
                        is_active=True,
                        role__in=[User.ROLE_USER, User.ROLE_THERAPIST],
                    ).count(),
                },
            }
        )


class SchemaUnavailableView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "success": False,
                "message": "OpenAPI schema support is unavailable because the optional 'inflection' package is not installed.",
                "errors": ["schema_unavailable"],
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
