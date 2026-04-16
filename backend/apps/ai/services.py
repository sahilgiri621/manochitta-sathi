import logging
import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
import requests

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_INSTRUCTION = (
    "You are Manochitta Sathi's supportive mental wellbeing assistant. "
    "Respond in a calm, practical, and concise way. "
    "Do not diagnose medical conditions or claim to replace a licensed therapist. "
    "If the user describes immediate self-harm, suicide risk, or danger, tell them to contact local emergency services "
    "or a trusted person right away and encourage urgent professional help."
)


def generate_ai_reply(message: str) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise ImproperlyConfigured("OPENROUTER_API_KEY is not configured.")

    response = requests.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": message},
            ],
            "temperature": 0.6,
            "max_tokens": 400,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices") or []
    content = ""
    if choices:
        content = ((choices[0] or {}).get("message") or {}).get("content") or ""
    reply = content.strip()
    if reply:
        return reply
    logger.warning("OpenRouter returned an empty response for AI chat.")
    raise RuntimeError("The AI service returned an empty response.")


def generate_grounded_ai_reply(message: str, conversation_context, user_context, grounded):
    if not settings.OPENROUTER_API_KEY:
        raise ImproperlyConfigured("OPENROUTER_API_KEY is not configured.")

    conversation_lines = [
        f"{(item or {}).get('role', 'user')}: {((item or {}).get('content') or '').strip()}"
        for item in (conversation_context or [])
        if ((item or {}).get("content") or "").strip()
    ]

    prompt = {
        "user_message": message,
        "conversation_context": conversation_lines[-6:],
        "user_context": user_context or {},
        "candidate_therapists": [
            {
                "id": item["id"],
                "name": item["name"],
                "specialization": item["specialization"],
                "experience_years": item["experience_years"],
                "languages": item["languages"],
                "consultation_fee": item["consultation_fee"],
                "availability_count": item["availability_count"],
                "matched_terms": item["matched_terms"],
            }
            for item in grounded["therapists"]
        ],
        "candidate_resources": [
            {
                "id": item["id"],
                "title": item["title"],
                "category": item["category"],
                "summary": item["summary"],
            }
            for item in grounded["resources"]
        ],
        "instructions": (
            "Respond with strict JSON only. "
            "Do not invent therapists or resources outside the provided candidates. "
            "Be supportive and non-diagnostic. "
            "Return keys: reply, recommended_therapists, recommended_resources. "
            "If the user did not ask for therapist or resource recommendations, keep both recommendation arrays empty "
            "and instead mention briefly that you can recommend therapists or resources if they want. "
            "recommended_therapists must be an array of objects with id and reason. "
            "recommended_resources must be an array of objects with id and reason."
        ),
    }

    response = requests.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": json.dumps(prompt)},
            ],
            "temperature": 0.4,
            "max_tokens": 700,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices") or []
    content = ""
    if choices:
        content = ((choices[0] or {}).get("message") or {}).get("content") or ""
    reply = content.strip()
    if reply:
        return reply
    logger.warning("OpenRouter returned an empty grounded recommendation response.")
    raise RuntimeError("The AI service returned an empty response.")
