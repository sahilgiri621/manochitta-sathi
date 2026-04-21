from datetime import timedelta
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.notifications.models import Notification
from apps.therapists.models import TherapistAvailability, TherapistProfile

from .models import PackagePlan, UserSubscription

User = get_user_model()


class PackageFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="package-user@example.com",
            password="UserPass123!",
            first_name="Package",
            last_name="User",
            role="user",
            is_email_verified=True,
        )
        therapist_user = User.objects.create_user(
            email="package-therapist@example.com",
            password="Therapist123!",
            first_name="Therapist",
            last_name="Package",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist = TherapistProfile.objects.get(user=therapist_user)
        self.therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist.consultation_fee = 1800
        self.therapist.save(update_fields=["approval_status", "consultation_fee"])
        self.slot = TherapistAvailability.objects.create(
            therapist=self.therapist,
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, minutes=50),
        )
        self.plan = PackagePlan.objects.create(
            name="Monthly Care",
            slug="monthly-care",
            description="Four sessions in one month.",
            session_credits=4,
            duration_days=30,
            price_amount=500000,
            is_active=True,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "UserPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    @patch("apps.packages.views.requests.post")
    def test_plan_purchase_creates_pending_subscription(self, mock_post):
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {"pidx": "sub-pidx-1", "payment_url": "https://khalti.test/subscription"}
        mock_post.return_value = mock_response

        response = self.client.post(
            f"/api/v1/packages/plans/{self.plan.id}/purchase/",
            {"frontend_origin": "http://127.0.0.1:3000"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        subscription = UserSubscription.objects.get(user=self.user, plan=self.plan)
        self.assertEqual(subscription.payment_status, UserSubscription.PAYMENT_PENDING)
        self.assertEqual(subscription.status, UserSubscription.STATUS_PENDING_PAYMENT)
        self.assertEqual(subscription.khalti_pidx, "sub-pidx-1")

    @patch("apps.packages.views.requests.post")
    def test_package_payment_verification_activates_subscription(self, mock_post):
        initiate = Mock()
        initiate.ok = True
        initiate.json.return_value = {"pidx": "sub-pidx-activate", "payment_url": "https://khalti.test/subscription"}
        mock_post.return_value = initiate

        purchase = self.client.post(f"/api/v1/packages/plans/{self.plan.id}/purchase/", {}, format="json")
        subscription_id = purchase.data["data"]["subscription"]

        with patch(
            "apps.packages.views.lookup_khalti_payment",
            return_value={
                "pidx": "sub-pidx-activate",
                "status": "Completed",
                "transaction_id": "sub-txn-1",
                "total_amount": 500000,
                "purchase_order_id": f"subscription-{subscription_id}",
            },
        ):
            response = self.client.post(
                "/api/v1/packages/subscriptions/verify/",
                {"subscription": subscription_id, "pidx": "sub-pidx-activate"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        subscription = UserSubscription.objects.get(pk=subscription_id)
        self.assertEqual(subscription.status, UserSubscription.STATUS_ACTIVE)
        self.assertEqual(subscription.remaining_credits, 4)
        self.assertEqual(Notification.objects.filter(user=self.user, title="Package activated").count(), 1)

    @patch("apps.packages.views.requests.post")
    def test_repeat_verification_does_not_duplicate_activation_notification(self, mock_post):
        initiate = Mock()
        initiate.ok = True
        initiate.json.return_value = {"pidx": "sub-pidx-repeat", "payment_url": "https://khalti.test/subscription"}
        mock_post.return_value = initiate

        purchase = self.client.post(f"/api/v1/packages/plans/{self.plan.id}/purchase/", {}, format="json")
        subscription_id = purchase.data["data"]["subscription"]

        with patch(
            "apps.packages.views.lookup_khalti_payment",
            return_value={
                "pidx": "sub-pidx-repeat",
                "status": "Completed",
                "transaction_id": "sub-txn-repeat",
                "total_amount": 500000,
                "purchase_order_id": f"subscription-{subscription_id}",
            },
        ):
            first_response = self.client.post(
                "/api/v1/packages/subscriptions/verify/",
                {"subscription": subscription_id, "pidx": "sub-pidx-repeat"},
                format="json",
            )
            second_response = self.client.post(
                "/api/v1/packages/subscriptions/verify/",
                {"subscription": subscription_id, "pidx": "sub-pidx-repeat"},
                format="json",
            )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=self.user, title="Package activated").count(), 1)

    @patch("apps.packages.services.create_google_meet_event_for_appointment")
    def test_booking_with_subscription_consumes_credit_and_confirms(self, mock_create_meeting):
        mock_create_meeting.return_value = Mock(
            provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
            status=Appointment.MEETING_STATUS_READY,
            event_id="pkg-event-1",
            meet_link="https://meet.google.com/pkg-link",
        )
        subscription = UserSubscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=UserSubscription.STATUS_ACTIVE,
            total_credits=4,
            remaining_credits=4,
            starts_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=30),
            activated_at=timezone.now(),
            payment_status=UserSubscription.PAYMENT_PAID,
            payment_provider="khalti",
            paid_amount=500000,
        )

        response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "booking_payment_type": "package",
                "subscription": subscription.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        appointment = Appointment.objects.get(pk=response.data["data"]["id"])
        subscription.refresh_from_db()
        self.slot.refresh_from_db()
        self.assertEqual(appointment.booking_payment_type, Appointment.BOOKING_PAYMENT_TYPE_PACKAGE)
        self.assertEqual(appointment.status, Appointment.STATUS_CONFIRMED)
        self.assertEqual(appointment.payment_status, Appointment.PAYMENT_PAID)
        self.assertEqual(subscription.remaining_credits, 3)
        self.assertFalse(self.slot.is_available)
        self.assertEqual(appointment.meeting_link, "https://meet.google.com/pkg-link")

    def test_cancellation_restores_subscription_credit(self):
        subscription = UserSubscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=UserSubscription.STATUS_ACTIVE,
            total_credits=4,
            remaining_credits=3,
            starts_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=30),
            activated_at=timezone.now(),
            payment_status=UserSubscription.PAYMENT_PAID,
        )
        appointment = Appointment.objects.create(
            user=self.user,
            therapist=self.therapist,
            availability_slot=self.slot,
            session_type="video",
            scheduled_start=self.slot.start_time,
            scheduled_end=self.slot.end_time,
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID,
            payment_provider="package",
            booking_payment_type=Appointment.BOOKING_PAYMENT_TYPE_PACKAGE,
            subscription=subscription,
            subscription_credit_consumed_at=timezone.now(),
        )
        self.slot.is_available = False
        self.slot.save(update_fields=["is_available", "updated_at"])

        response = self.client.post(
            f"/api/v1/appointments/{appointment.id}/cancel/",
            {"reason": "Need to reschedule later."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        subscription.refresh_from_db()
        appointment.refresh_from_db()
        self.assertEqual(subscription.remaining_credits, 4)
        self.assertIsNotNone(appointment.subscription_credit_restored_at)

    def test_expired_subscription_cannot_book(self):
        subscription = UserSubscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=UserSubscription.STATUS_ACTIVE,
            total_credits=4,
            remaining_credits=4,
            starts_at=timezone.now() - timedelta(days=40),
            expires_at=timezone.now() - timedelta(days=1),
            activated_at=timezone.now() - timedelta(days=40),
            payment_status=UserSubscription.PAYMENT_PAID,
        )

        response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "booking_payment_type": "package",
                "subscription": subscription.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, UserSubscription.STATUS_EXPIRED)

    def test_package_booking_requires_approved_therapist(self):
        subscription = UserSubscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=UserSubscription.STATUS_ACTIVE,
            total_credits=4,
            remaining_credits=4,
            starts_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=30),
            activated_at=timezone.now(),
            payment_status=UserSubscription.PAYMENT_PAID,
        )
        self.therapist.approval_status = TherapistProfile.STATUS_REJECTED
        self.therapist.save(update_fields=["approval_status"])

        response = self.client.post(
            "/api/v1/appointments/",
            {
                "therapist": self.therapist.id,
                "availability_slot": self.slot.id,
                "session_type": "video",
                "booking_payment_type": "package",
                "subscription": subscription.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_create_and_update_package_plan(self):
        admin = User.objects.create_user(
            email="package-admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": admin.email, "password": "AdminPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

        create_response = self.client.post(
            "/api/v1/packages/plans/",
            {
                "name": "Quarterly Care",
                "slug": "quarterly-care",
                "description": "Twelve sessions across three months.",
                "session_credits": 12,
                "duration_days": 90,
                "price_amount": 1200000,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        plan_id = create_response.data["data"]["id"]

        update_response = self.client.patch(
            f"/api/v1/packages/plans/{plan_id}/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertFalse(update_response.data["data"]["is_active"])
