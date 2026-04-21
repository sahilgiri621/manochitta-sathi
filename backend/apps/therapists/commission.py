from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum

from apps.appointments.models import Appointment

from .models import TherapistCommissionRule, TherapistProfile


DEFAULT_COMMISSION_RULES = (
    {"tier_name": "Starter", "min_sessions": 0, "max_sessions": 9, "commission_rate": Decimal("0.10")},
    {"tier_name": "Growth", "min_sessions": 10, "max_sessions": 50, "commission_rate": Decimal("0.15")},
    {"tier_name": "Established", "min_sessions": 51, "max_sessions": None, "commission_rate": Decimal("0.20")},
)


def ensure_default_commission_rules():
    if TherapistCommissionRule.objects.exists():
        return
    for rule in DEFAULT_COMMISSION_RULES:
        TherapistCommissionRule.objects.create(**rule)


def get_commission_rule_for_sessions(completed_sessions: int) -> TherapistCommissionRule:
    ensure_default_commission_rules()
    rules = TherapistCommissionRule.objects.filter(is_active=True).order_by("min_sessions", "id")
    for rule in rules:
        if completed_sessions >= rule.min_sessions and (rule.max_sessions is None or completed_sessions <= rule.max_sessions):
            return rule
    return rules.last()


def sync_therapist_commission_summary(therapist: TherapistProfile) -> TherapistProfile:
    completed_sessions = Appointment.objects.filter(
        therapist=therapist,
        status=Appointment.STATUS_COMPLETED,
    ).count()
    total_earnings = Appointment.objects.filter(
        therapist=therapist,
        status=Appointment.STATUS_COMPLETED,
        therapist_earning__isnull=False,
    ).aggregate(total=Sum("therapist_earning"))["total"] or Decimal("0.00")
    rule = get_commission_rule_for_sessions(completed_sessions)

    therapist.completed_sessions = completed_sessions
    therapist.total_earnings = total_earnings
    if rule:
        therapist.commission_tier = rule.tier_name
        therapist.commission_rate = rule.commission_rate
    therapist.save(
        update_fields=[
            "completed_sessions",
            "total_earnings",
            "commission_tier",
            "commission_rate",
            "updated_at",
        ]
    )
    return therapist


def get_next_commission_rule(therapist: TherapistProfile):
    ensure_default_commission_rules()
    return (
        TherapistCommissionRule.objects.filter(
            is_active=True,
            min_sessions__gt=therapist.completed_sessions,
        )
        .order_by("min_sessions", "id")
        .first()
    )


def finalize_completed_appointment_commission(appointment: Appointment) -> Appointment:
    with transaction.atomic():
        appointment = (
            Appointment.objects.select_for_update()
            .select_related("therapist")
            .get(pk=appointment.pk)
        )
        if appointment.status != Appointment.STATUS_COMPLETED:
            return appointment
        if appointment.therapist_earning is not None:
            sync_therapist_commission_summary(appointment.therapist)
            return appointment

        completed_sessions = Appointment.objects.filter(
            therapist=appointment.therapist,
            status=Appointment.STATUS_COMPLETED,
        ).count()
        rule = get_commission_rule_for_sessions(completed_sessions)
        session_price = appointment.therapist.consultation_fee or Decimal("0.00")
        commission_rate = rule.commission_rate if rule else Decimal("0.10")
        platform_commission = (session_price * commission_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        therapist_earning = (session_price - platform_commission).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        appointment.session_price = session_price
        appointment.commission_rate_used = commission_rate
        appointment.platform_commission = platform_commission
        appointment.therapist_earning = therapist_earning
        appointment.tier_used = rule.tier_name if rule else "Starter"
        appointment.save(
            update_fields=[
                "session_price",
                "commission_rate_used",
                "platform_commission",
                "therapist_earning",
                "tier_used",
                "updated_at",
            ]
        )
        sync_therapist_commission_summary(appointment.therapist)
        return appointment
