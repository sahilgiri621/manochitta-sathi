from django.urls import path

from .views import AssignedPatientProfileListView, MyProfileView

urlpatterns = [
    path("patients/", AssignedPatientProfileListView.as_view(), name="assigned-patient-profiles"),
    path("me/", MyProfileView.as_view(), name="my-profile"),
]
