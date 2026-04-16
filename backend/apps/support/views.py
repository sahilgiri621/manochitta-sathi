from django.db import transaction
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404

from apps.common.permissions import IsAdminRole, IsUserRole
from apps.common.responses import api_response
from apps.common.viewsets import WrappedModelViewSet, WrappedViewSetMixin

from .models import SupportMessage, SupportTicket
from .permissions import IsSupportTicketOwnerOrAdmin
from .serializers import SupportMessageSerializer, SupportTicketSerializer, SupportTicketStatusSerializer
from .services import (
    notify_admins_new_ticket,
    notify_admins_ticket_reply,
    notify_ticket_owner_reply,
    notify_ticket_owner_status_change,
)


class SupportTicketViewSet(WrappedModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupportTicketOwnerOrAdmin]
    http_method_names = ["get", "post", "patch", "head", "options"]
    ordering_fields = ("created_at", "updated_at")
    search_fields = ("subject", "description", "payment_reference", "user__email", "user__first_name", "user__last_name")

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsUserRole()]
        if self.action in {"partial_update", "update"}:
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated(), IsSupportTicketOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.action in {"partial_update", "update"}:
            return SupportTicketStatusSerializer
        return SupportTicketSerializer

    def get_queryset(self):
        queryset = SupportTicket.objects.prefetch_related("user", "appointment", "messages__sender").order_by("-updated_at", "-id")
        status_param = self.request.query_params.get("status")
        issue_type = self.request.query_params.get("issue_type")
        if status_param:
            queryset = queryset.filter(status=status_param)
        if issue_type:
            queryset = queryset.filter(issue_type=issue_type)

        user = self.request.user
        if user.role == "admin":
            return queryset
        return queryset.filter(user=user)

    def perform_create(self, serializer):
        ticket = serializer.save()
        notify_admins_new_ticket(ticket)

    def partial_update(self, request, *args, **kwargs):
        ticket = self.get_object()
        serializer = self.get_serializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        ticket.refresh_from_db()
        notify_ticket_owner_status_change(ticket)
        return api_response(
            data=SupportTicketSerializer(ticket, context=self.get_serializer_context()).data,
            message="Support ticket updated successfully.",
            status_code=status.HTTP_200_OK,
        )


class SupportMessageViewSet(WrappedViewSetMixin, mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = SupportMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ("created_at",)

    def get_ticket(self):
        ticket = get_object_or_404(
            SupportTicket.objects.prefetch_related("user", "appointment", "messages__sender"),
            pk=self.kwargs["ticket_pk"],
        )
        user = self.request.user
        if user.role == "admin":
            return ticket
        if user.role != "user" or ticket.user_id != user.id:
            raise PermissionDenied("You cannot access this support ticket.")
        return ticket

    def get_queryset(self):
        ticket = self.get_ticket()
        return ticket.messages.select_related("sender").order_by("created_at", "id")

    def create(self, request, *args, **kwargs):
        ticket = self.get_ticket()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            message = serializer.save(
                ticket=ticket,
                sender=request.user,
                is_admin=request.user.role == "admin",
            )
            if request.user.role == "admin":
                if ticket.status == SupportTicket.STATUS_OPEN:
                    ticket.status = SupportTicket.STATUS_IN_PROGRESS
                    ticket.save(update_fields=["status", "updated_at"])
                notify_ticket_owner_reply(ticket, replied_by_admin=True)
            else:
                if ticket.status == SupportTicket.STATUS_RESOLVED:
                    ticket.status = SupportTicket.STATUS_OPEN
                    ticket.save(update_fields=["status", "updated_at"])
                notify_admins_ticket_reply(ticket)

        output = SupportMessageSerializer(message, context=self.get_serializer_context()).data
        return api_response(
            data=output,
            message="Support message sent successfully.",
            status_code=status.HTTP_201_CREATED,
        )
