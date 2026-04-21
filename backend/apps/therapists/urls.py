from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    TherapistApplicationView,
    TherapistAvailabilityViewSet,
    TherapistCommissionRuleViewSet,
    TherapistProfileViewSet,
)

router = DefaultRouter()
router.trailing_slash = "/?"
router.register("profiles", TherapistProfileViewSet, basename="therapist-profiles")
router.register("availability", TherapistAvailabilityViewSet, basename="therapist-availability")
router.register("commission-rules", TherapistCommissionRuleViewSet, basename="therapist-commission-rules")

public_therapist_list = TherapistProfileViewSet.as_view({"get": "list"})
public_therapist_detail = TherapistProfileViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("", public_therapist_list, name="therapist-public-list"),
    path("<int:pk>/", public_therapist_detail, name="therapist-public-detail"),
    path("apply/", TherapistApplicationView.as_view(), name="therapist-apply"),
    path("apply", TherapistApplicationView.as_view()),
]

urlpatterns += router.urls
