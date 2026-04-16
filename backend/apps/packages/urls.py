from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import MySubscriptionView, PackagePlanViewSet, VerifySubscriptionPaymentView


router = DefaultRouter()
router.register("plans", PackagePlanViewSet, basename="package-plans")

urlpatterns = [
    *router.urls,
    path("subscriptions/me/", MySubscriptionView.as_view(), name="package-subscriptions-me"),
    path("subscriptions/verify/", VerifySubscriptionPaymentView.as_view(), name="package-subscriptions-verify"),
]
