import logging

from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.views import APIView

from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.common.responses import api_response

from .services import (
    ensure_payable_appointment,
    initiate_khalti_payment,
    lookup_khalti_payment,
    sync_appointment_payment_from_lookup,
)

logger = logging.getLogger(__name__)


class KhaltiInitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment")
        frontend_origin = request.data.get("frontend_origin")
        if not appointment_id:
            raise ValidationError("Appointment is required.")
        try:
            appointment = Appointment.objects.get(pk=appointment_id)
        except Appointment.DoesNotExist as exc:
            raise NotFound("Appointment not found.") from exc
        logger.info(
            "Khalti initiate requested",
            extra={
                "appointment_id": str(appointment.id),
                "user_id": request.user.id,
                "appointment_status": appointment.status,
                "payment_status": appointment.payment_status,
                "frontend_origin": frontend_origin or "",
            },
        )
        ensure_payable_appointment(appointment, request.user)
        result = initiate_khalti_payment(appointment, frontend_origin=frontend_origin)
        return api_response(
            data={
                "appointment": str(appointment.id),
                "pidx": result.pidx,
                "payment_url": result.payment_url,
                "amount": result.amount,
            },
            message="Khalti payment initiated successfully.",
            status_code=status.HTTP_200_OK,
        )


class KhaltiVerifyPaymentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pidx = request.data.get("pidx")
        appointment_id = request.data.get("appointment")
        if not pidx and not appointment_id:
            raise ValidationError("A pidx or appointment is required.")

        queryset = Appointment.objects.all()
        appointment = None
        if appointment_id:
            try:
                appointment = queryset.get(pk=appointment_id)
            except Appointment.DoesNotExist as exc:
                raise NotFound("Appointment not found.") from exc
        elif pidx:
            try:
                appointment = queryset.get(khalti_pidx=pidx)
            except Appointment.DoesNotExist as exc:
                raise NotFound("No appointment is associated with this payment.") from exc

        logger.info(
            "Khalti verify requested",
            extra={
                "appointment_id": str(appointment.id),
                "user_id": request.user.id if request.user.is_authenticated else None,
                "requested_pidx": pidx or "",
                "stored_pidx": appointment.khalti_pidx or "",
                "payment_status": appointment.payment_status,
                "is_authenticated": request.user.is_authenticated,
            },
        )
        if request.user.is_authenticated and request.user.id != appointment.user_id:
            raise NotFound("Appointment not found.")
        if not request.user.is_authenticated and not pidx:
            raise ValidationError("Payment verification requires a Khalti payment reference.")

        lookup_pidx = pidx or appointment.khalti_pidx
        if not lookup_pidx:
            raise ValidationError("Payment verification requires a Khalti payment reference.")

        lookup_data = lookup_khalti_payment(lookup_pidx)
        purchase_order_id = str(
            lookup_data.get("purchase_order_id")
            or lookup_data.get("purchaseOrderId")
            or ""
        ).strip()
        expected_purchase_order_id = f"appointment-{appointment.id}"
        if purchase_order_id and purchase_order_id != expected_purchase_order_id:
            raise ValidationError("Payment reference is invalid.")

        appointment = sync_appointment_payment_from_lookup(appointment, lookup_data)
        response_data = {
            "appointment_id": str(appointment.id),
            "payment_status": appointment.payment_status,
            "booking_status": appointment.status,
            "lookup": lookup_data,
        }

        if request.user.is_authenticated and request.user.id == appointment.user_id:
            response_data["appointment"] = AppointmentSerializer(appointment).data

        return api_response(
            data=response_data,
            message="Khalti payment verified successfully.",
            status_code=status.HTTP_200_OK,
        )
