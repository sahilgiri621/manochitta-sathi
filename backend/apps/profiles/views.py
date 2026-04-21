from rest_framework.views import APIView

from apps.appointments.models import Appointment
from apps.common.permissions import IsTherapistRole

from apps.common.responses import api_response

from .serializers import AssignedPatientProfileSerializer, UserProfileSerializer


class MyProfileView(APIView):
    def get(self, request):
        return api_response(data=UserProfileSerializer(request.user.profile).data, message="Profile retrieved successfully.")

    def put(self, request):
        serializer = UserProfileSerializer(request.user.profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(data=serializer.data, message="Profile updated successfully.")

    def patch(self, request):
        serializer = UserProfileSerializer(request.user.profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(data=serializer.data, message="Profile updated successfully.")


class AssignedPatientProfileListView(APIView):
    permission_classes = [IsTherapistRole]

    def get(self, request):
        visible_statuses = [
            Appointment.STATUS_PENDING,
            Appointment.STATUS_CONFIRMED,
            Appointment.STATUS_ACCEPTED,
            Appointment.STATUS_REJECTED,
            Appointment.STATUS_CANCELLED,
            Appointment.STATUS_COMPLETED,
            Appointment.STATUS_MISSED,
            Appointment.STATUS_RESCHEDULED,
        ]
        appointments = (
            Appointment.objects.filter(
                therapist__user=request.user,
                status__in=visible_statuses,
            )
            .select_related("user__profile")
            .order_by("user__first_name", "user__last_name", "user__email", "-scheduled_start")
        )
        patients_by_id = {}
        for appointment in appointments:
            patient = appointment.user
            if patient.id not in patients_by_id:
                patient.appointment_count = 0
                patient.last_appointment_at = appointment.scheduled_start
                patients_by_id[patient.id] = patient
            patients_by_id[patient.id].appointment_count += 1
            if appointment.scheduled_start > patients_by_id[patient.id].last_appointment_at:
                patients_by_id[patient.id].last_appointment_at = appointment.scheduled_start

        patients = list(patients_by_id.values())
        serializer = AssignedPatientProfileSerializer(patients, many=True)
        return api_response(data=serializer.data, message="Assigned patient profiles retrieved successfully.")
