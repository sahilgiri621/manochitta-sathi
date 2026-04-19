from rest_framework import serializers

from apps.appointments.models import Appointment

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    therapist_name = serializers.CharField(source="therapist.user.full_name", read_only=True)
    appointment_scheduled_start = serializers.DateTimeField(source="appointment.scheduled_start", read_only=True)

    class Meta:
        model = Feedback
        fields = (
            "id",
            "appointment",
            "appointment_scheduled_start",
            "user",
            "user_name",
            "therapist",
            "therapist_name",
            "rating",
            "service_rating",
            "comment",
            "created_at",
        )
        read_only_fields = ("user", "therapist")

    def validate_appointment(self, value):
        request = self.context["request"]
        if value.user_id != request.user.id:
            raise serializers.ValidationError("You can only leave feedback for your own appointments.")
        if value.status != Appointment.STATUS_COMPLETED:
            raise serializers.ValidationError("Feedback can only be added after a completed session.")
        queryset = Feedback.objects.filter(appointment=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Feedback has already been submitted for this appointment.")
        return value

    def create(self, validated_data):
        appointment = validated_data["appointment"]
        validated_data["user"] = self.context["request"].user
        validated_data["therapist"] = appointment.therapist
        return super().create(validated_data)
