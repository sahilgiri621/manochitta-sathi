from rest_framework import serializers

from apps.appointments.models import Appointment
from apps.therapists.models import TherapistProfile

from .models import PatientRecord


class PatientRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    therapist_name = serializers.CharField(source="therapist.user.full_name", read_only=True)
    appointment_scheduled_start = serializers.DateTimeField(source="appointment.scheduled_start", read_only=True)

    class Meta:
        model = PatientRecord
        fields = (
            "id",
            "patient",
            "patient_name",
            "therapist",
            "therapist_name",
            "appointment",
            "appointment_scheduled_start",
            "notes",
            "diagnosis_notes",
            "recommendations",
            "session_summary",
            "patient_progress",
            "next_steps",
            "risk_flag",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("therapist",)

    def validate_patient(self, value):
        if value.role != "user":
            raise serializers.ValidationError("Patient records can only be created for user accounts.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        instance = getattr(self, "instance", None)

        patient = attrs.get("patient", getattr(instance, "patient", None))
        appointment = attrs.get("appointment", getattr(instance, "appointment", None))

        if user.role != "therapist":
            raise serializers.ValidationError("Only therapists can create or update patient records.")

        therapist_profile = TherapistProfile.objects.get(user=user)

        if appointment:
            if appointment.user_id != patient.id:
                raise serializers.ValidationError({"appointment": "Selected appointment does not belong to this patient."})
            if appointment.therapist_id != therapist_profile.id:
                raise serializers.ValidationError({"appointment": "You can only use appointments assigned to you."})
        else:
            has_relationship = Appointment.objects.filter(user=patient, therapist=therapist_profile).exists()
            if not has_relationship:
                raise serializers.ValidationError({"patient": "You can only manage records for patients assigned to you."})

        attrs["therapist"] = therapist_profile
        return attrs
