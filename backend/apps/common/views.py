from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status


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
