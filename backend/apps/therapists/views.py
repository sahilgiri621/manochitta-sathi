from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from apps.auditlog.models import AdminAction
from apps.appointments.models import Appointment
from apps.common.date_filters import filter_queryset_by_date
from apps.common.permissions import IsAdminRole, IsTherapistRole
from apps.common.responses import api_response
from apps.common.viewsets import WrappedModelViewSet, WrappedReadOnlyModelViewSet
from apps.notifications.models import Notification

from .models import TherapistAvailability, TherapistProfile
from .serializers import (
    TherapistApplicationSerializer,
    TherapistApprovalSerializer,
    TherapistAvailabilitySerializer,
    TherapistClinicSerializer,
    TherapistProfileSerializer,
)


class TherapistApplicationView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        serializer = TherapistApplicationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        therapist_profile = serializer.save()
        return api_response(
            data=TherapistProfileSerializer(therapist_profile, context={"request": request}).data,
            message="Therapist application submitted successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class TherapistProfileViewSet(WrappedReadOnlyModelViewSet):
    serializer_class = TherapistProfileSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    search_fields = ("specialization", "qualifications", "languages", "user__first_name", "user__last_name")
    ordering_fields = ("created_at", "experience_years", "consultation_fee")

    def get_queryset(self):
        queryset = TherapistProfile.objects.prefetch_related("user__profile", "clinic").order_by("-pk")
        user = self.request.user
        queryset = filter_queryset_by_date(queryset, "created_at", self.request.query_params.get("date"))
        if user.is_authenticated and user.role == "admin":
            return queryset
        queryset = queryset.filter(approval_status=TherapistProfile.STATUS_APPROVED)
        specialization = self.request.query_params.get("specialization")
        language = self.request.query_params.get("language")
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)
        if language:
            queryset = queryset.filter(languages__icontains=language)
        return queryset

    @action(detail=False, methods=["get", "patch"], permission_classes=[IsTherapistRole])
    def me(self, request):
        therapist_profile = TherapistProfile.objects.prefetch_related("user__profile", "clinic").get(user=request.user)
        if request.method == "GET":
            return api_response(
                data=TherapistProfileSerializer(therapist_profile, context={"request": request}).data,
                message="Therapist profile retrieved successfully.",
            )

        serializer = TherapistProfileSerializer(therapist_profile, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(data=serializer.data, message="Therapist profile updated successfully.")

    @action(detail=False, methods=["get", "put", "patch"], permission_classes=[IsTherapistRole], url_path="me/clinic")
    def clinic(self, request):
        therapist_profile = TherapistProfile.objects.prefetch_related("clinic").get(user=request.user)
        clinic = getattr(therapist_profile, "clinic", None)

        if request.method == "GET":
            if clinic is None:
                return api_response(data=None, message="No clinic information found.")
            return api_response(
                data=TherapistClinicSerializer(clinic, context={"request": request}).data,
                message="Clinic information retrieved successfully.",
            )

        serializer = TherapistClinicSerializer(
            clinic,
            data=request.data,
            partial=request.method == "PATCH",
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(therapist=therapist_profile)
        return api_response(data=serializer.data, message="Clinic information saved successfully.")

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def approve(self, request, pk=None):
        therapist = self.get_object()
        serializer = TherapistApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        therapist.approval_status = serializer.validated_data["approval_status"]
        therapist.approved_by = request.user
        therapist.approved_at = timezone.now()
        therapist.save(update_fields=["approval_status", "approved_by", "approved_at", "updated_at"])
        Notification.objects.create(
            user=therapist.user,
            title="Therapist profile reviewed",
            message=f"Your therapist application was {therapist.approval_status}.",
            notification_type=Notification.TYPE_APPROVAL,
        )
        AdminAction.objects.create(
            admin=request.user,
            action="therapist_approval_updated",
            target_type="therapist_profile",
            target_id=str(therapist.id),
            details={"approval_status": therapist.approval_status},
        )
        return api_response(
            data=TherapistProfileSerializer(therapist, context={"request": request}).data,
            message="Therapist approval status updated.",
        )


class TherapistAvailabilityViewSet(WrappedModelViewSet):
    serializer_class = TherapistAvailabilitySerializer
    permission_classes = [permissions.AllowAny]
    ordering_fields = ("start_time", "created_at")

    def get_queryset(self):
        queryset = TherapistAvailability.objects.prefetch_related("therapist__user").order_by("start_time", "id")
        user = self.request.user
        therapist_id = self.request.query_params.get("therapist")
        if user.is_authenticated and user.role == "therapist":
            return queryset.filter(therapist__user=user)
        if therapist_id:
            queryset = queryset.filter(
                therapist_id=therapist_id,
                therapist__approval_status=TherapistProfile.STATUS_APPROVED,
                is_available=True,
                start_time__gt=timezone.now(),
            )
        elif not user.is_authenticated or user.role != "admin":
            queryset = queryset.filter(
                therapist__approval_status=TherapistProfile.STATUS_APPROVED,
                is_available=True,
                start_time__gt=timezone.now(),
            )
        return queryset

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsTherapistRole()]
        return super().get_permissions()

    def perform_create(self, serializer):
        therapist_profile = TherapistProfile.objects.get(user=self.request.user)
        serializer.save(therapist=therapist_profile)

    def perform_destroy(self, instance):
        if instance.appointments.exclude(
            status__in=[Appointment.STATUS_CANCELLED, Appointment.STATUS_REJECTED]
        ).exists():
            raise ValidationError("Booked availability slots cannot be deleted.")
        instance.delete()
