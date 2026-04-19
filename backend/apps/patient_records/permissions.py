from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanAccessPatientRecord(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role in {"admin", "therapist", "user"}):
            return False
        if request.method not in SAFE_METHODS and request.user.role != "therapist":
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in SAFE_METHODS:
            if user.role == "admin":
                return True
            if user.role == "therapist":
                return obj.therapist.user_id == user.id
            return obj.patient_id == user.id

        if user.role != "therapist":
            return False
        return obj.therapist.user_id == user.id
