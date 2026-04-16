import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.common.responses import api_response

from .recommendation_service import get_grounded_recommendations, merge_ai_rankings
from .serializers import AIChatSerializer
from .services import generate_grounded_ai_reply

logger = logging.getLogger(__name__)


def _to_user_facing_ai_error(exc: Exception) -> str:
    message = str(exc)
    lowered = message.lower()

    if "resource_exhausted" in lowered or "quota" in lowered or "rate limit" in lowered:
        return "The assistant is temporarily unavailable because the AI quota has been exceeded. Please try again later."
    if "api key expired" in lowered or "api_key_invalid" in lowered or "unauthorized" in lowered or "401" in lowered:
        return "The assistant is temporarily unavailable because the AI API key is invalid or expired."
    if "invalid_argument" in lowered:
        return "The assistant could not process that request right now. Please try again."
    return "AI chat is temporarily unavailable."


class AIChatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AIChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        grounded = get_grounded_recommendations(
            serializer.validated_data["message"],
            serializer.validated_data.get("conversation_context", []),
            serializer.validated_data.get("user_context", {}),
            request=request,
        )

        try:
            raw_reply = generate_grounded_ai_reply(
                serializer.validated_data["message"],
                serializer.validated_data.get("conversation_context", []),
                serializer.validated_data.get("user_context", {}),
                grounded,
            )
            result = merge_ai_rankings(raw_reply, grounded)
        except ImproperlyConfigured as exc:
            return api_response(
                message=str(exc),
                success=False,
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:  # pragma: no cover - network/provider failures
            logger.exception("AI chat request failed")
            return api_response(
                message=_to_user_facing_ai_error(exc),
                success=False,
                status_code=status.HTTP_502_BAD_GATEWAY,
            )

        return api_response(
            data=result,
            message="AI reply generated successfully.",
        )
