from rest_framework.routers import DefaultRouter

from .views import PatientRecordViewSet

router = DefaultRouter()
router.register("", PatientRecordViewSet, basename="patient-records")

urlpatterns = router.urls
