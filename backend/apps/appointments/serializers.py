from django.utils import timezone
from rest_framework import serializers

from apps.therapists.models import TherapistAvailability, TherapistProfile

from .models import Appointment, AppointmentEvent


class AppointmentEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = AppointmentEvent
        fields = ("id", "status", "note", "actor", "actor_name", "created_at")


class AppointmentSerializer(serializers.ModelSerializer):
    therapist_name = serializers.CharField(source="therapist.user.full_name", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    events = AppointmentEventSerializer(many=True, read_only=True)
    has_feedback = serializers.SerializerMethodField(read_only=True)
    requires_attendance_confirmation = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "user",
            "user_name",
            "therapist",
            "therapist_name",
            "availability_slot",
            "session_type",
            "scheduled_start",
            "scheduled_end",
            "status",
            "has_feedback",
            "requires_attendance_confirmation",
            "payment_status",
            "booking_payment_type",
            "subscription",
            "payment_provider",
            "paid_amount",
            "subscription_credit_consumed_at",
            "subscription_credit_restored_at",
            "khalti_pidx",
            "payment_transaction_id",
            "payment_initiated_at",
            "payment_verified_at",
            "meeting_provider",
            "meeting_link",
            "external_calendar_event_id",
            "meeting_status",
            "meeting_created_at",
            "session_price",
            "commission_rate_used",
            "platform_commission",
            "therapist_earning",
            "tier_used",
            "notes",
            "cancellation_reason",
            "therapist_response_note",
            "rescheduled_from",
            "events",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "user",
            "status",
            "payment_status",
            "payment_provider",
            "paid_amount",
            "subscription_credit_consumed_at",
            "subscription_credit_restored_at",
            "khalti_pidx",
            "payment_transaction_id",
            "payment_initiated_at",
            "payment_verified_at",
            "meeting_provider",
            "meeting_link",
            "external_calendar_event_id",
            "meeting_status",
            "meeting_created_at",
            "session_price",
            "commission_rate_used",
            "platform_commission",
            "therapist_earning",
            "tier_used",
            "cancellation_reason",
            "therapist_response_note",
            "rescheduled_from",
        )
        extra_kwargs = {
            "scheduled_start": {"required": False},
            "scheduled_end": {"required": False},
        }

    def validate(self, attrs):
        availability_slot = attrs.get("availability_slot", getattr(self.instance, "availability_slot", None))
        start = attrs.get("scheduled_start", getattr(self.instance, "scheduled_start", None))
        end = attrs.get("scheduled_end", getattr(self.instance, "scheduled_end", None))
        therapist = attrs.get("therapist", getattr(self.instance, "therapist", None))
        booking_payment_type = attrs.get("booking_payment_type", getattr(self.instance, "booking_payment_type", Appointment.BOOKING_PAYMENT_TYPE_SINGLE))
        subscription = attrs.get("subscription", getattr(self.instance, "subscription", None))
        if availability_slot:
            start = availability_slot.start_time
            end = availability_slot.end_time
        if start and end and start >= end:
            raise serializers.ValidationError("Scheduled end must be after scheduled start.")
        if start and start <= timezone.now():
            raise serializers.ValidationError("Appointments must be scheduled in the future.")
        if therapist and therapist.approval_status != TherapistProfile.STATUS_APPROVED:
            raise serializers.ValidationError("Appointments can only be booked with approved therapists.")
        if availability_slot:
            if availability_slot.therapist_id != therapist.id:
                raise serializers.ValidationError("Selected availability slot does not belong to the therapist.")
            if not availability_slot.is_available and (
                not self.instance or self.instance.availability_slot_id != availability_slot.id
            ):
                raise serializers.ValidationError("Selected availability slot is not available.")
        if booking_payment_type == Appointment.BOOKING_PAYMENT_TYPE_PACKAGE and subscription is None:
            raise serializers.ValidationError("A package subscription is required for package bookings.")
        if booking_payment_type == Appointment.BOOKING_PAYMENT_TYPE_SINGLE and subscription is not None:
            raise serializers.ValidationError("Single bookings cannot be attached to a package subscription.")
        return attrs

    def get_has_feedback(self, obj):
        if obj is None:
            return False
        return hasattr(obj, "feedback") and obj.feedback is not None

    def get_requires_attendance_confirmation(self, obj):
        if obj is None:
            return False
        if obj.status in (Appointment.STATUS_CANCELLED, Appointment.STATUS_REJECTED, Appointment.STATUS_COMPLETED, Appointment.STATUS_MISSED):
            return False
        if obj.scheduled_end and obj.scheduled_end <= timezone.now():
            return True
        return False


class AppointmentDecisionSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class AppointmentRescheduleSerializer(serializers.Serializer):
    availability_slot = serializers.PrimaryKeyRelatedField(queryset=TherapistAvailability.objects.select_related("therapist"))
    session_type = serializers.ChoiceField(choices=Appointment.SESSION_TYPE_CHOICES, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class AppointmentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class AppointmentAttendanceSerializer(serializers.Serializer):
    attended = serializers.BooleanField()
    note = serializers.CharField(required=False, allow_blank=True)


class AppointmentCompletionSerializer(serializers.Serializer):
    notes = serializers.CharField()
    session_summary = serializers.CharField()
    patient_progress = serializers.CharField()
    recommendations = serializers.CharField()
    next_steps = serializers.CharField()
    risk_flag = serializers.CharField(required=False, allow_blank=True)
    diagnosis_notes = serializers.CharField(required=False, allow_blank=True)
