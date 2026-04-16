from django.urls import path

from .views import KhaltiInitiatePaymentView, KhaltiVerifyPaymentView


urlpatterns = [
    path("khalti/initiate/", KhaltiInitiatePaymentView.as_view(), name="payments-khalti-initiate"),
    path("khalti/verify/", KhaltiVerifyPaymentView.as_view(), name="payments-khalti-verify"),
]
