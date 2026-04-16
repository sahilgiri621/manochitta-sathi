from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import Notification

from .models import SupportMessage, SupportTicket

User = get_user_model()


class SupportApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="support-user@example.com",
            password="UserPass123!",
            first_name="Support",
            last_name="User",
            role="user",
            is_email_verified=True,
        )
        self.other_user = User.objects.create_user(
            email="support-other@example.com",
            password="UserPass123!",
            first_name="Other",
            last_name="User",
            role="user",
            is_email_verified=True,
        )
        self.admin = User.objects.create_user(
            email="support-admin@example.com",
            password="AdminPass123!",
            first_name="Support",
            last_name="Admin",
            role="admin",
            is_staff=True,
            is_email_verified=True,
        )
        self.ticket = SupportTicket.objects.create(
            user=self.user,
            subject="Payment stuck",
            issue_type=SupportTicket.ISSUE_TYPE_PAYMENT,
            description="Khalti payment is stuck on pending.",
        )
        SupportMessage.objects.create(
            ticket=self.ticket,
            sender=self.user,
            message=self.ticket.description,
            is_admin=False,
        )

    def authenticate(self, email, password):
        login = self.client.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")

    def test_user_can_create_ticket_and_initial_message(self):
        self.authenticate(self.user.email, "UserPass123!")

        response = self.client.post(
            "/api/v1/support/tickets/",
            {
                "subject": "Refund request",
                "issue_type": "refund",
                "description": "Please review my refund.",
                "payment_reference": "pidx-12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket = SupportTicket.objects.get(pk=response.data["data"]["id"])
        self.assertEqual(ticket.user_id, self.user.id)
        self.assertEqual(ticket.messages.count(), 1)
        self.assertEqual(Notification.objects.filter(user=self.admin, title="New support ticket").count(), 1)

    def test_user_only_sees_own_tickets(self):
        SupportTicket.objects.create(
            user=self.other_user,
            subject="Technical issue",
            issue_type=SupportTicket.ISSUE_TYPE_TECHNICAL,
            description="Other user ticket.",
        )
        self.authenticate(self.user.email, "UserPass123!")

        response = self.client.get("/api/v1/support/tickets/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.ticket.id)

    def test_admin_can_list_all_and_update_status(self):
        self.authenticate(self.admin.email, "AdminPass123!")

        list_response = self.client.get("/api/v1/support/tickets/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["data"]["count"], 1)

        update_response = self.client.patch(
            f"/api/v1/support/tickets/{self.ticket.id}/",
            {"status": SupportTicket.STATUS_RESOLVED},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, SupportTicket.STATUS_RESOLVED)

    def test_user_cannot_reply_to_other_users_ticket(self):
        other_ticket = SupportTicket.objects.create(
            user=self.other_user,
            subject="Other ticket",
            issue_type=SupportTicket.ISSUE_TYPE_APPOINTMENT,
            description="Need help with appointment.",
        )
        self.authenticate(self.user.email, "UserPass123!")

        response = self.client.post(
            f"/api/v1/support/tickets/{other_ticket.id}/messages/",
            {"message": "Trying to intrude."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_reply_notifies_owner(self):
        self.authenticate(self.admin.email, "AdminPass123!")

        response = self.client.post(
            f"/api/v1/support/tickets/{self.ticket.id}/messages/",
            {"message": "We are reviewing this for you."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, SupportTicket.STATUS_IN_PROGRESS)
        self.assertEqual(Notification.objects.filter(user=self.user, title="Support replied").count(), 1)

