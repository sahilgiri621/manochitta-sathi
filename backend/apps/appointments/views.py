from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.common.date_filters import filter_queryset_by_date
from apps.common.permissions import IsAdminRole, IsTherapistRole
from apps.common.responses import api_response
from apps.common.viewsets import WrappedModelViewSet
from apps.patient_records.models import PatientRecord
from apps.therapists.commission import finalize_completed_appointment_commission
from apps.therapists.models import TherapistAvailability

from .models import Appointment
from .serializers import (
    AppointmentAttendanceSerializer,
    AppointmentCancelSerializer,
    AppointmentCompletionSerializer,
    AppointmentRescheduleSerializer,
    AppointmentSerializer,
)
from .services import (
    create_appointment_event,
    ensure_appointment_conversation,
    release_slot_if_no_active_booking,
    notify_appointment_users,
)


class AppointmentViewSet(WrappedModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ("notes", "status", "user__first_name", "user__last_name", "therapist__user__first_name", "therapist__user__last_name")
    ordering_fields = ("scheduled_start", "created_at")

    def get_queryset(self):
        queryset = Appointment.objects.prefetch_related("user", "therapist__user", "availability_slot", "events__actor")
        queryset = filter_queryset_by_date(queryset, "scheduled_start", self.request.query_params.get("date"))
        status_param = self.request.query_params.get("status")
        if status_param:
            statuses = [value.strip() for value in status_param.split(",") if value.strip()]
            queryset = queryset.filter(status__in=statuses)
        user = self.request.user
        if user.role == "admin":
            return queryset
        if user.role == "therapist":
            return queryset.exclude(status=Appointment.STATUS_PENDING_PAYMENT).filter(therapist__user=user)
        return queryset.filter(user=user)

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        if self.request.user.role != "user":
            raise PermissionDenied("Only users can book appointments.")
        if serializer.validated_data.get("booking_payment_type") == Appointment.BOOKING_PAYMENT_TYPE_PACKAGE:
            from apps.packages.services import book_with_subscription

            appointment = book_with_subscription(
                user=self.request.user,
                therapist=serializer.validated_data["therapist"],
                availability_slot=serializer.validated_data["availability_slot"],
                session_type=serializer.validated_data["session_type"],
                notes=serializer.validated_data.get("notes", ""),
                subscription_id=getattr(serializer.validated_data.get("subscription"), "id", None),
            )
            serializer.instance = appointment
            return
        with transaction.atomic():
            locked_slot = None
            save_kwargs = {"user": self.request.user, "status": Appointment.STATUS_PENDING_PAYMENT}
            if serializer.validated_data.get("availability_slot"):
                locked_slot = TherapistAvailability.objects.select_for_update().get(
                    pk=serializer.validated_data["availability_slot"].pk
                )
                if not locked_slot.is_available:
                    raise ValidationError("Selected availability slot is not available.")
                if Appointment.objects.filter(
                    user=self.request.user,
                    availability_slot=locked_slot,
                    status=Appointment.STATUS_PENDING_PAYMENT,
                    payment_status__in=[
                        Appointment.PAYMENT_UNPAID,
                        Appointment.PAYMENT_PENDING,
                        Appointment.PAYMENT_FAILED,
                        Appointment.PAYMENT_CANCELLED,
                        Appointment.PAYMENT_EXPIRED,
                    ],
                ).exists():
                    raise ValidationError("You already have a payment in progress for this slot.")
                save_kwargs.update(
                    {
                        "availability_slot": locked_slot,
                        "scheduled_start": locked_slot.start_time,
                        "scheduled_end": locked_slot.end_time,
                    }
                )
            appointment = serializer.save(**save_kwargs)
        ensure_appointment_conversation(appointment)
        create_appointment_event(
            appointment,
            self.request.user,
            appointment.status,
            "Booking intent created. Proceed to payment to confirm.",
        )

    @action(detail=True, methods=["post"], permission_classes=[IsTherapistRole])
    def accept(self, request, pk=None):
        raise ValidationError("Standard slot bookings are confirmed automatically after successful payment.")

    @action(detail=True, methods=["post"], permission_classes=[IsTherapistRole])
    def reject(self, request, pk=None):
        raise ValidationError("Standard slot bookings no longer require therapist rejection after payment. Cancel or reschedule the session instead.")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role != "admin" and request.user.id not in (appointment.user_id, appointment.therapist.user_id):
            raise PermissionDenied("You are not allowed to cancel this appointment.")
        serializer = AppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            appointment = Appointment.objects.select_for_update().select_related("availability_slot").get(pk=appointment.pk)
            appointment.status = Appointment.STATUS_CANCELLED
            appointment.cancellation_reason = serializer.validated_data.get("reason", "")
            appointment.save(update_fields=["status", "cancellation_reason", "updated_at"])
            if appointment.availability_slot:
                release_slot_if_no_active_booking(appointment.availability_slot)
            if appointment.booking_payment_type == Appointment.BOOKING_PAYMENT_TYPE_PACKAGE:
                from apps.packages.services import restore_subscription_credit_for_appointment

                restore_subscription_credit_for_appointment(appointment)
        create_appointment_event(appointment, request.user, appointment.status, appointment.cancellation_reason)
        notify_appointment_users(appointment, "Appointment cancelled", "An appointment has been cancelled.")
        return api_response(data=AppointmentSerializer(appointment).data, message="Appointment cancelled.")

    @action(detail=True, methods=["post"])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role != "admin" and request.user.id not in (appointment.user_id, appointment.therapist.user_id):
            raise PermissionDenied("You are not allowed to reschedule this appointment.")
        if appointment.payment_status != Appointment.PAYMENT_PAID:
            raise ValidationError("Only paid appointments can be rescheduled.")
        serializer = AppointmentRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        slot = serializer.validated_data["availability_slot"]
        if slot.therapist_id != appointment.therapist_id:
            raise PermissionDenied("You can only reschedule to a slot owned by the same therapist.")
        if not slot.is_available or slot.start_time <= timezone.now():
            raise ValidationError("Selected availability slot is not available.")
        previous_slot = appointment.availability_slot
        appointment.rescheduled_from = appointment.rescheduled_from or appointment
        appointment.availability_slot = slot
        appointment.scheduled_start = slot.start_time
        appointment.scheduled_end = slot.end_time
        appointment.status = Appointment.STATUS_RESCHEDULED
        appointment.session_type = serializer.validated_data.get("session_type", appointment.session_type)
        appointment.notes = serializer.validated_data.get("notes", appointment.notes)
        appointment.save()
        if previous_slot and previous_slot.id != slot.id:
            release_slot_if_no_active_booking(previous_slot)
        slot.is_available = False
        slot.save(update_fields=["is_available", "updated_at"])
        create_appointment_event(appointment, request.user, appointment.status, "Appointment rescheduled.")
        notify_appointment_users(appointment, "Appointment rescheduled", "An appointment has been rescheduled.")
        return api_response(data=AppointmentSerializer(appointment).data, message="Appointment rescheduled.")

    @action(detail=True, methods=["post"])
    def attendance(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role != "admin" and request.user.id not in (appointment.user_id, appointment.therapist.user_id):
            raise PermissionDenied("You are not allowed to confirm attendance for this appointment.")
        if appointment.scheduled_end is None or appointment.scheduled_end > timezone.now():
            raise ValidationError("Attendance can only be confirmed after the session end time.")
        if appointment.status in Appointment.TERMINAL_STATUSES:
            raise ValidationError("Attendance has already been finalized for this appointment.")
        if appointment.status not in Appointment.ACTIVE_STATUSES:
            raise ValidationError("Only booked appointments can be finalized after the session time.")
        serializer = AppointmentAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attended = serializer.validated_data["attended"]
        note = serializer.validated_data.get("note", "")
        if request.user.role == "therapist" and not attended and not note.strip():
            raise ValidationError("Therapists must provide a reason when marking a session as missed.")
        if attended:
            if appointment.payment_status != Appointment.PAYMENT_PAID and appointment.booking_payment_type != Appointment.BOOKING_PAYMENT_TYPE_PACKAGE:
                raise ValidationError("Only paid appointments can be marked as attended.")
            appointment.status = Appointment.STATUS_COMPLETED
            appointment.save(update_fields=["status", "updated_at"])
            appointment = finalize_completed_appointment_commission(appointment)
            create_appointment_event(appointment, request.user, appointment.status, note or "Attendance confirmed.")
            notify_appointment_users(appointment, "Appointment completed", "Your session was marked as completed.")
            return api_response(data=AppointmentSerializer(appointment).data, message="Appointment marked as completed.")
        appointment.status = Appointment.STATUS_MISSED
        appointment.save(update_fields=["status", "updated_at"])
        create_appointment_event(appointment, request.user, appointment.status, note or "Attendance confirmed as missed.")
        notify_appointment_users(appointment, "Appointment missed", "Your session was marked as missed.")
        return api_response(data=AppointmentSerializer(appointment).data, message="Appointment marked as missed.")

    @action(detail=False, methods=["get"], permission_classes=[IsAdminRole], url_path="revenue-report")
    def revenue_report(self, request):
        def format_amount(value):
            if value is None:
                return Decimal("0.00")
            return value.quantize(Decimal("0.01"))

        queryset = (
            Appointment.objects.prefetch_related("user", "therapist__user")
            .filter(
                status=Appointment.STATUS_COMPLETED,
                therapist_earning__isnull=False,
                platform_commission__isnull=False,
            )
            .order_by("-scheduled_start", "-pk")
        )

        search = request.query_params.get("search", "").strip()
        if search:
            for term in search.split():
                queryset = queryset.filter(
                    Q(therapist__user__first_name__icontains=term)
                    | Q(therapist__user__last_name__icontains=term)
                    | Q(therapist__user__email__icontains=term)
                )

        date_from = request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(scheduled_start__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(scheduled_start__date__lte=date_to)

        totals = queryset.aggregate(
            gross_revenue=Sum("session_price"),
            therapist_revenue=Sum("therapist_earning"),
            platform_revenue=Sum("platform_commission"),
        )
        therapist_totals = []
        grouped_rows = (
            queryset.values(
                "therapist_id",
                "therapist__user__first_name",
                "therapist__user__last_name",
                "therapist__user__email",
            )
            .annotate(
                completed_sessions=Count("id"),
                gross_revenue=Sum("session_price"),
                therapist_revenue=Sum("therapist_earning"),
                platform_revenue=Sum("platform_commission"),
            )
            .order_by("-therapist_revenue", "therapist_id")
        )
        for row in grouped_rows:
            therapist_name = " ".join(
                part
                for part in [row.get("therapist__user__first_name"), row.get("therapist__user__last_name")]
                if part
            ).strip()
            therapist_totals.append(
                {
                    "therapist_id": str(row["therapist_id"]),
                    "therapist_name": therapist_name,
                    "therapist_email": row.get("therapist__user__email") or "",
                    "completed_sessions": row.get("completed_sessions") or 0,
                    "gross_revenue": format_amount(row.get("gross_revenue")),
                    "therapist_revenue": format_amount(row.get("therapist_revenue")),
                    "platform_revenue": format_amount(row.get("platform_revenue")),
                }
            )

        page = self.paginate_queryset(queryset)
        items = page if page is not None else queryset
        results = [
            {
                "id": str(appointment.id),
                "therapist_id": str(appointment.therapist_id),
                "therapist_name": appointment.therapist.user.full_name,
                "therapist_email": appointment.therapist.user.email,
                "user_name": appointment.user.full_name,
                "session_type": appointment.session_type,
                "scheduled_start": appointment.scheduled_start,
                "payment_verified_at": appointment.payment_verified_at,
                "session_price": appointment.session_price or Decimal("0.00"),
                "platform_commission": appointment.platform_commission or Decimal("0.00"),
                "therapist_earning": appointment.therapist_earning or Decimal("0.00"),
                "commission_rate_used": appointment.commission_rate_used,
                "tier_used": appointment.tier_used or "",
                "payment_provider": appointment.payment_provider or "",
                "payment_transaction_id": appointment.payment_transaction_id or "",
            }
            for appointment in items
        ]

        count = self.paginator.page.paginator.count if page is not None else queryset.count()
        next_link = self.paginator.get_next_link() if page is not None else None
        previous_link = self.paginator.get_previous_link() if page is not None else None

        return api_response(
            data={
                "count": count,
                "next": next_link,
                "previous": previous_link,
                "results": results,
                "summary": {
                    "completed_sessions": queryset.count(),
                    "gross_revenue": format_amount(totals["gross_revenue"]),
                    "therapist_revenue": format_amount(totals["therapist_revenue"]),
                    "platform_revenue": format_amount(totals["platform_revenue"]),
                },
                "therapist_totals": therapist_totals,
            },
            message="Revenue report retrieved successfully.",
        )

    @action(detail=True, methods=["post"], permission_classes=[IsTherapistRole])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        if appointment.therapist.user_id != request.user.id:
            raise PermissionDenied("You can only complete your own appointments.")
        if appointment.scheduled_end is None or appointment.scheduled_end > timezone.now():
            raise ValidationError("Appointments can only be completed after the session end time.")
        if appointment.payment_status != Appointment.PAYMENT_PAID or appointment.status not in (
            Appointment.STATUS_CONFIRMED,
            Appointment.STATUS_ACCEPTED,
            Appointment.STATUS_RESCHEDULED,
        ):
            raise ValidationError("Only confirmed paid appointments can be completed.")
        serializer = AppointmentCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        completion_data = serializer.validated_data
        therapist_profile = appointment.therapist
        record_defaults = {
            "patient": appointment.user,
            "therapist": therapist_profile,
            "notes": completion_data["notes"],
            "recommendations": completion_data["recommendations"],
            "session_summary": completion_data["session_summary"],
            "patient_progress": completion_data["patient_progress"],
            "next_steps": completion_data["next_steps"],
            "completed_at": timezone.now(),
        }
        if completion_data.get("diagnosis_notes"):
            record_defaults["diagnosis_notes"] = completion_data["diagnosis_notes"]
        if completion_data.get("risk_flag"):
            record_defaults["risk_flag"] = completion_data["risk_flag"]
        existing_record = (
            PatientRecord.objects.filter(appointment=appointment, therapist=therapist_profile)
            .order_by("-updated_at", "-id")
            .first()
        )
        if existing_record:
            for field, value in record_defaults.items():
                setattr(existing_record, field, value)
            existing_record.save()
        else:
            PatientRecord.objects.create(
                appointment=appointment,
                **record_defaults,
            )
        appointment.status = Appointment.STATUS_COMPLETED
        appointment.save(update_fields=["status", "updated_at"])
        appointment = finalize_completed_appointment_commission(appointment)
        create_appointment_event(appointment, request.user, appointment.status, "Appointment completed.")
        notify_appointment_users(appointment, "Appointment completed", "Your session has been marked as completed.")
        return api_response(data=AppointmentSerializer(appointment).data, message="Appointment completed.")
