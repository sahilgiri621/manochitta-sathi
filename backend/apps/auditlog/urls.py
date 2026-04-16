from rest_framework.routers import DefaultRouter

from .views import AdminActionViewSet

router = DefaultRouter()
router.register("", AdminActionViewSet, basename="admin-actions")

urlpatterns = router.urls
