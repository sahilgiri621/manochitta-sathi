import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.views import APIView

from apps.common.permissions import IsAdminRole
from apps.common.responses import api_response
from apps.common.viewsets import WrappedModelViewSet
from apps.payments.services import KHALTI_INITIATE_ENDPOINT, get_khalti_headers, lookup_khalti_payment, resolve_frontend_origin

from .models import PackagePlan, UserSubscription
from .serializers import PackagePlanSerializer, UserSubscriptionSerializer
from .services import activate_subscription_from_lookup, create_pending_subscription_purchase, expire_stale_subscriptions


class PackagePlanViewSet(WrappedModelViewSet):
    serializer_class = PackagePlanSerializer
    permission_classes = [permissions.AllowAny]
    ordering_fields = ("price_amount", "created_at")

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsAdminRole()]
        if self.action == "purchase":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = PackagePlan.objects.order_by("price_amount", "id")
        if self.request.user.is_authenticated and self.request.user.role == "admin":
            return queryset
        return queryset.filter(is_active=True)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def purchase(self, request, pk=None):
        if request.user.role != "user":
            raise ValidationError("Only users can purchase packages.")
        plan = self.get_object()
        if not plan.is_active:
            raise ValidationError("This package is not available for purchase.")

        frontend_origin = resolve_frontend_origin(request.data.get("frontend_origin"))
        subscription = create_pending_subscription_purchase(request.user, plan)
        return_url = (
            f"{frontend_origin}/services/payment/result"
            if frontend_origin
            else f"{settings.FRONTEND_BASE_URL}/services/payment/result"
        )
        payload = {
            "return_url": f"{return_url}?subscription={subscription.id}",
            "website_url": frontend_origin or settings.KHALTI_WEBSITE_URL,
            "amount": plan.price_amount,
            "purchase_order_id": f"subscription-{subscription.id}",
            "purchase_order_name": plan.name,
            "customer_info": {
                "name": request.user.full_name,
                "email": request.user.email,
                "phone": request.user.phone or "",
            },
        }
        response = requests.post(
            f"{settings.KHALTI_BASE_URL.rstrip('/')}{KHALTI_INITIATE_ENDPOINT}",
            json=payload,
            headers=get_khalti_headers(),
            timeout=20,
        )
        try:
            data = response.json()
        except ValueError:
            data = {}
        if not response.ok or not data.get("payment_url") or not data.get("pidx"):
            raise ValidationError("Package payment initiation failed.")

        subscription.payment_status = UserSubscription.PAYMENT_PENDING
        subscription.payment_provider = "khalti"
        subscription.khalti_pidx = data.get("pidx", "")
        subscription.payment_initiated_at = timezone.now()
        subscription.save(
            update_fields=[
                "payment_status",
                "payment_provider",
                "khalti_pidx",
                "payment_initiated_at",
                "updated_at",
            ]
        )
        return api_response(
            data={
                "subscription": str(subscription.id),
                "pidx": data["pidx"],
                "payment_url": data["payment_url"],
                "amount": plan.price_amount,
            },
            message="Package payment initiated successfully.",
            status_code=status.HTTP_200_OK,
        )


class MySubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        expire_stale_subscriptions(user=request.user)
        queryset = UserSubscription.objects.select_related("plan").filter(user=request.user)
        return api_response(
            data=UserSubscriptionSerializer(queryset, many=True).data,
            message="Subscriptions retrieved successfully.",
            status_code=status.HTTP_200_OK,
        )


class VerifySubscriptionPaymentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        subscription_id = request.data.get("subscription")
        pidx = request.data.get("pidx")
        if not subscription_id and not pidx:
            raise ValidationError("A subscription or pidx is required.")

        queryset = UserSubscription.objects.all()
        if subscription_id:
            try:
                subscription = queryset.get(pk=subscription_id)
            except UserSubscription.DoesNotExist as exc:
                raise NotFound("Subscription not found.") from exc
        else:
            try:
                subscription = queryset.get(khalti_pidx=pidx)
            except UserSubscription.DoesNotExist as exc:
                raise NotFound("No package purchase is associated with this payment.") from exc

        if request.user.is_authenticated and request.user.id != subscription.user_id:
            raise NotFound("Subscription not found.")
        if not request.user.is_authenticated and not pidx:
            raise ValidationError("Package verification requires a Khalti payment reference.")

        lookup_pidx = pidx or subscription.khalti_pidx
        if not lookup_pidx:
            raise ValidationError("Package verification requires a Khalti payment reference.")
        lookup_data = lookup_khalti_payment(lookup_pidx)
        expected_purchase_order_id = f"subscription-{subscription.id}"
        purchase_order_id = str(
            lookup_data.get("purchase_order_id")
            or lookup_data.get("purchaseOrderId")
            or ""
        ).strip()
        if purchase_order_id and purchase_order_id != expected_purchase_order_id:
            raise ValidationError("Payment reference is invalid.")

        subscription = activate_subscription_from_lookup(subscription, lookup_data)
        response_data = {
            "subscription_id": str(subscription.id),
            "payment_status": subscription.payment_status,
            "subscription_status": subscription.status,
            "lookup": lookup_data,
        }
        if request.user.is_authenticated and request.user.id == subscription.user_id:
            response_data["subscription"] = UserSubscriptionSerializer(subscription).data
        return api_response(
            data=response_data,
            message="Package payment verified successfully.",
            status_code=status.HTTP_200_OK,
        )
