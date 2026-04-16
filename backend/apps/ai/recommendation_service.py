import json
import logging
from decimal import Decimal, InvalidOperation

from django.utils import timezone

from apps.resources.models import Resource
from apps.therapists.models import TherapistProfile

logger = logging.getLogger(__name__)

CONCERN_KEYWORDS = {
    "stress": ["stress", "burnout", "pressure", "overwhelmed", "tired"],
    "anxiety": ["anxiety", "anxious", "panic", "worry", "nervous"],
    "low_mood": ["sad", "low", "down", "depressed", "hopeless", "lonely"],
    "relationship": ["relationship", "partner", "marriage", "couple", "family", "conflict"],
    "academic": ["study", "exam", "college", "school", "academic", "student"],
    "trauma": ["trauma", "abuse", "grief", "loss", "flashback"],
}

CONCERN_RESOURCE_TERMS = {
    "stress": ["stress", "breathing", "mindfulness"],
    "anxiety": ["anxiety", "calm", "grounding"],
    "low_mood": ["mood", "self-care", "support"],
    "relationship": ["relationship", "communication", "family"],
    "academic": ["focus", "study", "student"],
    "trauma": ["trauma", "healing", "grief"],
}

THERAPIST_REQUEST_TERMS = (
    "therapist",
    "doctor",
    "counselor",
    "counsellor",
    "psychologist",
    "psychiatrist",
    "recommend a therapist",
    "suggest a therapist",
    "find me a therapist",
    "help me find",
)

RESOURCE_REQUEST_TERMS = (
    "resource",
    "resources",
    "wellness resource",
    "wellness resources",
    "article",
    "articles",
    "guide",
    "guides",
    "exercise",
    "exercises",
    "reading material",
)


def _flatten_conversation(conversation_context):
    parts = []
    for item in conversation_context or []:
        role = (item or {}).get("role", "user")
        content = ((item or {}).get("content") or "").strip()
        if content:
            parts.append(f"{role}: {content}")
    return "\n".join(parts)


def _extract_concerns(text):
    lowered = text.lower()
    concerns = [label for label, keywords in CONCERN_KEYWORDS.items() if any(keyword in lowered for keyword in keywords)]
    return concerns or ["general_support"]


def _extract_budget(user_context):
    raw_value = (user_context or {}).get("max_fee")
    if raw_value in (None, ""):
        return None
    try:
        return Decimal(str(raw_value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _extract_language_preferences(text, user_context):
    languages = []
    explicit = (user_context or {}).get("preferred_language")
    if isinstance(explicit, str) and explicit.strip():
        languages.append(explicit.strip().lower())
    lowered = text.lower()
    for candidate in ("english", "nepali", "hindi"):
        if candidate in lowered and candidate not in languages:
            languages.append(candidate)
    return languages


def _should_recommend_items(text):
    lowered = (text or "").lower()
    wants_therapists = any(term in lowered for term in THERAPIST_REQUEST_TERMS)
    wants_resources = any(term in lowered for term in RESOURCE_REQUEST_TERMS)
    return wants_therapists, wants_resources


def _future_available_slot_count(therapist):
    now = timezone.now()
    return sum(
        1
        for slot in getattr(therapist, "availability_slots").all()
        if slot.is_available and slot.start_time > now
    )


def _serialize_therapist(therapist, request, score, matched_terms, availability_count):
    image_url = ""
    if therapist.profile_image:
        url = therapist.profile_image.url
        image_url = request.build_absolute_uri(url) if request else url
    return {
        "id": therapist.id,
        "name": therapist.user.full_name or therapist.user.email,
        "specialization": therapist.specialization,
        "experience_years": therapist.experience_years,
        "languages": therapist.languages,
        "consultation_fee": str(therapist.consultation_fee or ""),
        "availability_count": availability_count,
        "profile_image": image_url,
        "profile_url": f"/therapists/{therapist.id}",
        "matched_terms": matched_terms,
        "score": score,
        "reason": "",
    }


def _serialize_resource(resource):
    return {
        "id": resource.id,
        "title": resource.title,
        "summary": resource.summary,
        "category": resource.category.name,
        "url": f"/resources/{resource.id}",
        "reason": "",
    }


def get_grounded_recommendations(message, conversation_context, user_context, request=None):
    combined_text = "\n".join(filter(None, [_flatten_conversation(conversation_context), message]))
    concerns = _extract_concerns(combined_text)
    preferred_languages = _extract_language_preferences(combined_text, user_context)
    budget = _extract_budget(user_context)
    wants_therapists, wants_resources = _should_recommend_items(message)

    therapist_candidates = []
    if wants_therapists:
        therapists = (
            TherapistProfile.objects.prefetch_related("user__profile", "availability_slots")
            .filter(approval_status=TherapistProfile.STATUS_APPROVED, user__is_active=True)
            .order_by("-experience_years", "-id")
        )

        for therapist in therapists:
            search_blob = " ".join(
                [
                    therapist.specialization or "",
                    therapist.bio or "",
                    therapist.qualifications or "",
                    therapist.languages or "",
                ]
            ).lower()
            matched_terms = [concern for concern in concerns if concern != "general_support" and concern.split("_")[0] in search_blob]
            score = therapist.experience_years
            if matched_terms:
                score += 10 * len(matched_terms)
            if preferred_languages and any(language in (therapist.languages or "").lower() for language in preferred_languages):
                score += 4
            availability_count = _future_available_slot_count(therapist)
            if availability_count:
                score += 3
            if budget is not None and therapist.consultation_fee is not None and therapist.consultation_fee <= budget:
                score += 2
            therapist_candidates.append(
                _serialize_therapist(therapist, request, score, matched_terms, availability_count)
            )

        therapist_candidates.sort(key=lambda item: (item["score"], item["availability_count"], item["experience_years"]), reverse=True)
        therapist_candidates = therapist_candidates[:3]

    resource_candidates = []
    if wants_resources:
        resources = Resource.objects.select_related("category").filter(published=True).order_by("title")
        resource_terms = {term for concern in concerns for term in CONCERN_RESOURCE_TERMS.get(concern, [])}
        for resource in resources:
            blob = " ".join([resource.title, resource.summary, resource.category.name, resource.content[:300]]).lower()
            if not resource_terms or any(term in blob for term in resource_terms):
                resource_candidates.append(_serialize_resource(resource))
            if len(resource_candidates) >= 3:
                break

    return {
        "concerns": concerns,
        "wants_therapists": wants_therapists,
        "wants_resources": wants_resources,
        "therapists": therapist_candidates,
        "resources": resource_candidates,
    }


def _strip_json_fence(raw_text):
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    return cleaned.strip()


def merge_ai_rankings(raw_text, grounded):
    therapists_by_id = {str(item["id"]): item for item in grounded["therapists"]}
    resources_by_id = {str(item["id"]): item for item in grounded["resources"]}

    try:
        payload = json.loads(_strip_json_fence(raw_text))
    except json.JSONDecodeError:
        logger.warning("OpenRouter returned non-JSON recommendation payload.")
        return {
            "reply": raw_text.strip(),
            "recommended_therapists": grounded["therapists"] if grounded.get("wants_therapists") else [],
            "recommended_resources": grounded["resources"] if grounded.get("wants_resources") else [],
        }

    recommended_therapists = []
    for item in payload.get("recommended_therapists", []):
        key = str(item.get("id", ""))
        if key in therapists_by_id:
            therapist = dict(therapists_by_id[key])
            therapist["reason"] = str(item.get("reason") or therapist.get("reason") or "Potential fit based on your concerns.")
            recommended_therapists.append(therapist)

    recommended_resources = []
    for item in payload.get("recommended_resources", []):
        key = str(item.get("id", ""))
        if key in resources_by_id:
            resource = dict(resources_by_id[key])
            resource["reason"] = str(item.get("reason") or resource.get("reason") or "May support you alongside therapist guidance.")
            recommended_resources.append(resource)

    if grounded.get("wants_therapists") and not recommended_therapists:
        recommended_therapists = grounded["therapists"]
    if grounded.get("wants_resources") and not recommended_resources:
        recommended_resources = grounded["resources"]

    return {
        "reply": str(payload.get("reply") or raw_text).strip(),
        "recommended_therapists": recommended_therapists,
        "recommended_resources": recommended_resources,
    }
