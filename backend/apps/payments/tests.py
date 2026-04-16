from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.notifications.models import Notification
from apps.therapists.models import TherapistAvailability, TherapistProfile

User = get_user_model()


class KhaltiPaymentApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="payment-user@example.com",
            password="UserPass123!",
            first_name="Payment",
            last_name="User",
            role="user",
            is_email_verified=True,
        )
        therapist_user = User.objects.create_user(
            email="payment-therapist@example.com",
            password="Therapist123!",
            first_name="Therapist",
            last_name="One",
            role="therapist",
            is_email_verified=True,
        )
        self.therapist = TherapistProfile.objects.get(user=therapist_user)
        self.therapist.approval_status = TherapistProfile.STATUS_APPROVED
        self.therapist.consultation_fee = 1500
        self.therapist.save(update_fields=["approval_status", "consultation_fee"])
        self.slot = TherapistAvailability.objects.create(
            therapist=self.therapist,
            start_time="2099-01-01T10:00:00Z",
            end_time="2099-01-01T10:50:00Z",
        )
        self.appointment = Appointment.objects.create(
            user=self.user,
            therapist=self.therapist,
            availability_slot=self.slot,
            session_type="video",
            scheduled_start="2099-01-01T10:00:00Z",
            scheduled_end="2099-01-01T10:50:00Z",
            status=Appointment.STATUS_PENDING_PAYMENT,
        )

        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "UserPass123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    @patch("apps.payments.services.requests.post")
    def test_initiate_payment_creates_pending_khalti_state(self, mock_post):
        mock_response = Mock()
        mock_response.json.return_value = {
            "pidx": "test-pidx-123",
            "payment_url": "https://khalti.test/pay/123",
        }
        mock_response.text = '{"pidx":"test-pidx-123","payment_url":"https://khalti.test/pay/123"}'
        mock_response.ok = True
        mock_post.return_value = mock_response

        response = self.client.post(
            "/api/v1/payments/khalti/initiate/",
            {"appointment": self.appointment.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_PENDING)
        self.assertEqual(self.appointment.khalti_pidx, "test-pidx-123")
        self.assertEqual(self.appointment.paid_amount, 150000)
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs["json"]["amount"], 150000)
        self.assertEqual(kwargs["json"]["purchase_order_id"], f"appointment-{self.appointment.id}")
        self.assertIn(f"appointment={self.appointment.id}", kwargs["json"]["return_url"])

    @patch("apps.payments.services.requests.post")
    def test_initiate_payment_uses_active_frontend_origin_for_callback_urls(self, mock_post):
        mock_response = Mock()
        mock_response.json.return_value = {
            "pidx": "test-pidx-123",
            "payment_url": "https://khalti.test/pay/123",
        }
        mock_response.text = '{"pidx":"test-pidx-123","payment_url":"https://khalti.test/pay/123"}'
        mock_response.ok = True
        mock_post.return_value = mock_response

        response = self.client.post(
            "/api/v1/payments/khalti/initiate/",
            {"appointment": self.appointment.id, "frontend_origin": "http://127.0.0.1:3000"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs["json"]["website_url"], "http://127.0.0.1:3000")
        self.assertEqual(
            kwargs["json"]["return_url"],
            f"http://127.0.0.1:3000/payment/result/khalti?appointment={self.appointment.id}",
        )

    @patch("apps.payments.services.create_google_meet_event_for_appointment")
    @patch("apps.payments.services.requests.post")
    def test_verify_payment_marks_appointment_paid_on_completed_lookup(self, mock_post, mock_create_meeting):
        mock_create_meeting.return_value = Mock(
            provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
            status=Appointment.MEETING_STATUS_READY,
            event_id="calendar-event-123",
            meet_link="https://meet.google.com/abc-defg-hij",
        )
        initiate_response = Mock()
        initiate_response.json.return_value = {
            "pidx": "verify-pidx-123",
            "payment_url": "https://khalti.test/pay/verify",
        }
        initiate_response.text = '{"pidx":"verify-pidx-123","payment_url":"https://khalti.test/pay/verify"}'
        initiate_response.ok = True

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "verify-pidx-123",
            "status": "Completed",
            "transaction_id": "txn-123",
            "total_amount": 150000,
        }
        verify_response.text = '{"pidx":"verify-pidx-123","status":"Completed","transaction_id":"txn-123","total_amount":150000}'
        verify_response.ok = True
        mock_post.side_effect = [initiate_response, verify_response]

        self.client.post("/api/v1/payments/khalti/initiate/", {"appointment": self.appointment.id}, format="json")
        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "verify-pidx-123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_PAID)
        self.assertEqual(self.appointment.status, Appointment.STATUS_CONFIRMED)
        self.assertEqual(self.appointment.payment_transaction_id, "txn-123")
        self.assertEqual(self.appointment.meeting_link, "https://meet.google.com/abc-defg-hij")
        self.assertEqual(self.appointment.external_calendar_event_id, "calendar-event-123")
        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_available)
        mock_create_meeting.assert_called_once()

    @patch("apps.payments.services.requests.post")
    def test_verify_payment_handles_cancelled_status(self, mock_post):
        self.appointment.payment_status = Appointment.PAYMENT_PENDING
        self.appointment.khalti_pidx = "pending-pidx"
        self.appointment.save(update_fields=["payment_status", "khalti_pidx", "updated_at"])

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "pending-pidx",
            "status": "User canceled",
            "transaction_id": "",
            "total_amount": 150000,
        }
        verify_response.text = '{"pidx":"pending-pidx","status":"User canceled","transaction_id":"","total_amount":150000}'
        verify_response.ok = True
        mock_post.return_value = verify_response

        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_CANCELLED)
        self.assertEqual(self.appointment.status, Appointment.STATUS_PENDING_PAYMENT)
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_available)

    @patch("apps.payments.services.create_google_meet_event_for_appointment")
    @patch("apps.payments.services.requests.post")
    def test_verify_paid_payment_is_idempotent(self, mock_post, mock_create_meeting):
        self.appointment.payment_status = Appointment.PAYMENT_PAID
        self.appointment.status = Appointment.STATUS_CONFIRMED
        self.appointment.khalti_pidx = "paid-pidx"
        self.appointment.payment_transaction_id = "txn-existing"
        self.appointment.meeting_provider = Appointment.MEETING_PROVIDER_GOOGLE_MEET
        self.appointment.meeting_link = "https://meet.google.com/existing-link"
        self.appointment.external_calendar_event_id = "existing-event"
        self.appointment.meeting_status = Appointment.MEETING_STATUS_READY
        self.appointment.save(
            update_fields=[
                "payment_status",
                "status",
                "khalti_pidx",
                "payment_transaction_id",
                "meeting_provider",
                "meeting_link",
                "external_calendar_event_id",
                "meeting_status",
                "updated_at",
            ]
        )
        self.slot.is_available = False
        self.slot.save(update_fields=["is_available", "updated_at"])

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "paid-pidx",
            "status": "Completed",
            "transaction_id": "txn-existing",
            "total_amount": 150000,
        }
        verify_response.text = '{"pidx":"paid-pidx","status":"Completed","transaction_id":"txn-existing","total_amount":150000}'
        verify_response.ok = True
        mock_post.return_value = verify_response

        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.slot.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_PAID)
        self.assertEqual(self.appointment.status, Appointment.STATUS_CONFIRMED)
        self.assertFalse(self.slot.is_available)
        self.assertEqual(self.appointment.meeting_link, "https://meet.google.com/existing-link")
        mock_create_meeting.assert_not_called()

    @patch("apps.payments.services.requests.post")
    def test_verify_payment_allows_callback_lookup_without_auth_when_pidx_matches(self, mock_post):
        self.client.credentials()
        self.appointment.payment_status = Appointment.PAYMENT_PENDING
        self.appointment.khalti_pidx = "callback-pidx"
        self.appointment.save(update_fields=["payment_status", "khalti_pidx", "updated_at"])

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "callback-pidx",
            "status": "Completed",
            "transaction_id": "txn-callback",
            "total_amount": 150000,
        }
        verify_response.text = '{"pidx":"callback-pidx","status":"Completed","transaction_id":"txn-callback","total_amount":150000}'
        verify_response.ok = True
        mock_post.return_value = verify_response

        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "callback-pidx"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_PAID)
        self.assertEqual(self.appointment.payment_transaction_id, "txn-callback")
        self.assertEqual(response.data["data"]["appointment_id"], str(self.appointment.id))
        self.assertEqual(response.data["data"]["payment_status"], Appointment.PAYMENT_PAID)
        self.assertEqual(response.data["data"]["booking_status"], Appointment.STATUS_CONFIRMED)
        self.assertNotIn("appointment", response.data["data"])

    @patch("apps.payments.services.requests.post")
    def test_verify_payment_accepts_returned_pidx_when_khalti_order_matches_appointment(self, mock_post):
        self.appointment.payment_status = Appointment.PAYMENT_PENDING
        self.appointment.khalti_pidx = "stale-pidx"
        self.appointment.save(update_fields=["payment_status", "khalti_pidx", "updated_at"])

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "returned-pidx",
            "status": "Completed",
            "transaction_id": "txn-returned",
            "total_amount": 150000,
            "purchase_order_id": f"appointment-{self.appointment.id}",
        }
        verify_response.text = (
            '{"pidx":"returned-pidx","status":"Completed","transaction_id":"txn-returned",'
            '"total_amount":150000,"purchase_order_id":"appointment-%s"}' % self.appointment.id
        )
        verify_response.ok = True
        mock_post.return_value = verify_response

        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "returned-pidx"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_PAID)
        self.assertEqual(self.appointment.khalti_pidx, "returned-pidx")

    @patch("apps.payments.services.requests.post")
    def test_verify_payment_is_not_blocked_by_initiation_only_state_validation(self, mock_post):
        self.appointment.status = Appointment.STATUS_CONFIRMED
        self.appointment.payment_status = Appointment.PAYMENT_PENDING
        self.appointment.khalti_pidx = "confirmed-pidx"
        self.appointment.save(update_fields=["status", "payment_status", "khalti_pidx", "updated_at"])

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "confirmed-pidx",
            "status": "Completed",
            "transaction_id": "txn-confirmed",
            "total_amount": 150000,
            "purchase_order_id": f"appointment-{self.appointment.id}",
        }
        verify_response.text = (
            '{"pidx":"confirmed-pidx","status":"Completed","transaction_id":"txn-confirmed",'
            '"total_amount":150000,"purchase_order_id":"appointment-%s"}' % self.appointment.id
        )
        verify_response.ok = True
        mock_post.return_value = verify_response

        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "confirmed-pidx"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.payment_status, Appointment.PAYMENT_PAID)

    @patch("apps.payments.services.requests.post")
    def test_initiate_payment_requires_payment_url_from_khalti(self, mock_post):
        mock_response = Mock()
        mock_response.json.return_value = {
            "pidx": "test-pidx-123",
        }
        mock_response.text = '{"pidx":"test-pidx-123"}'
        mock_response.ok = True
        mock_post.return_value = mock_response

        response = self.client.post(
            "/api/v1/payments/khalti/initiate/",
            {"appointment": self.appointment.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Payment initiation failed: Khalti did not return a payment URL.")

    def test_user_cannot_initiate_payment_for_another_users_appointment(self):
        other_user = User.objects.create_user(
            email="payment-other@example.com",
            password="UserPass123!",
            first_name="Other",
            role="user",
            is_email_verified=True,
        )
        other_appointment = Appointment.objects.create(
            user=other_user,
            therapist=self.therapist,
            session_type="video",
            scheduled_start="2099-01-02T10:00:00Z",
            scheduled_end="2099-01-02T10:50:00Z",
            status=Appointment.STATUS_PENDING_PAYMENT,
        )

        response = self.client.post(
            "/api/v1/payments/khalti/initiate/",
            {"appointment": other_appointment.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.payments.services.create_google_meet_event_for_appointment")
    @patch("apps.payments.services.requests.post")
    def test_duplicate_verification_does_not_create_duplicate_meeting(self, mock_post, mock_create_meeting):
        mock_create_meeting.return_value = Mock(
            provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
            status=Appointment.MEETING_STATUS_READY,
            event_id="meeting-event-1",
            meet_link="https://meet.google.com/meeting-once",
        )

        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "repeat-pidx",
            "status": "Completed",
            "transaction_id": "txn-repeat",
            "total_amount": 150000,
            "purchase_order_id": f"appointment-{self.appointment.id}",
        }
        verify_response.text = '{"pidx":"repeat-pidx","status":"Completed","transaction_id":"txn-repeat","total_amount":150000}'
        verify_response.ok = True
        mock_post.return_value = verify_response

        self.appointment.payment_status = Appointment.PAYMENT_PENDING
        self.appointment.khalti_pidx = "repeat-pidx"
        self.appointment.save(update_fields=["payment_status", "khalti_pidx", "updated_at"])

        first = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "repeat-pidx"},
            format="json",
        )
        second = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "repeat-pidx"},
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.external_calendar_event_id, "meeting-event-1")
        self.assertEqual(self.appointment.meeting_link, "https://meet.google.com/meeting-once")
        self.assertEqual(mock_create_meeting.call_count, 1)

    @patch("apps.payments.services.create_google_meet_event_for_appointment")
    @patch("apps.payments.services.requests.post")
    def test_retry_meeting_creation_notifies_when_link_becomes_ready_later(self, mock_post, mock_create_meeting):
        verify_response = Mock()
        verify_response.json.return_value = {
            "pidx": "retry-pidx",
            "status": "Completed",
            "transaction_id": "txn-retry",
            "total_amount": 150000,
            "purchase_order_id": f"appointment-{self.appointment.id}",
        }
        verify_response.text = '{"pidx":"retry-pidx","status":"Completed","transaction_id":"txn-retry","total_amount":150000}'
        verify_response.ok = True
        mock_post.return_value = verify_response

        self.appointment.payment_status = Appointment.PAYMENT_PAID
        self.appointment.status = Appointment.STATUS_CONFIRMED
        self.appointment.khalti_pidx = "retry-pidx"
        self.appointment.meeting_provider = Appointment.MEETING_PROVIDER_GOOGLE_MEET
        self.appointment.meeting_status = Appointment.MEETING_STATUS_FAILED
        self.appointment.meeting_link = ""
        self.appointment.external_calendar_event_id = ""
        self.appointment.save(
            update_fields=[
                "payment_status",
                "status",
                "khalti_pidx",
                "meeting_provider",
                "meeting_status",
                "meeting_link",
                "external_calendar_event_id",
                "updated_at",
            ]
        )

        mock_create_meeting.return_value = Mock(
            provider=Appointment.MEETING_PROVIDER_GOOGLE_MEET,
            status=Appointment.MEETING_STATUS_READY,
            event_id="retry-event-1",
            meet_link="https://meet.google.com/retry-link",
        )

        response = self.client.post(
            "/api/v1/payments/khalti/verify/",
            {"appointment": self.appointment.id, "pidx": "retry-pidx"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.meeting_status, Appointment.MEETING_STATUS_READY)
        self.assertEqual(
            Notification.objects.filter(user=self.user, title="Google Meet link ready").count(),
            1,
        )
        self.assertEqual(
            Notification.objects.filter(user=self.therapist.user, title="Paid booking confirmed").count(),
            1,
        )
