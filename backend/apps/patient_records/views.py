from rest_framework import permissions

from apps.common.viewsets import WrappedModelViewSet

from .models import PatientRecord
from .permissions import CanAccessPatientRecord
from .serializers import PatientRecordSerializer


class PatientRecordViewSet(WrappedModelViewSet):
    serializer_class = PatientRecordSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessPatientRecord]
    http_method_names = ["get", "post", "patch", "head", "options"]
    ordering_fields = ("created_at", "updated_at")
    search_fields = ("patient__first_name", "patient__last_name", "patient__email", "notes", "diagnosis_notes", "recommendations")

    def get_queryset(self):
        # Oracle can raise ORA-00918 when the user table is joined twice through
        # both patient and therapist__user in a single select_related query.
        queryset = (
            PatientRecord.objects.prefetch_related("patient", "therapist__user", "appointment")
            .order_by("-updated_at", "-id")
        )
        user = self.request.user
        patient_id = self.request.query_params.get("patient_id")
        therapist_id = self.request.query_params.get("therapist_id")

        if user.role == "admin":
            if patient_id:
                queryset = queryset.filter(patient_id=patient_id)
            if therapist_id:
                queryset = queryset.filter(therapist_id=therapist_id)
            return queryset

        if user.role == "therapist":
            queryset = queryset.filter(therapist__user=user)
            if patient_id:
                queryset = queryset.filter(patient_id=patient_id)
            return queryset

        return queryset.filter(patient=user)
