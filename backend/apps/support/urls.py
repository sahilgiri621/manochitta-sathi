from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import SupportMessageViewSet, SupportTicketViewSet

router = DefaultRouter()
router.register("tickets", SupportTicketViewSet, basename="support-tickets")

urlpatterns = [
    *router.urls,
    path(
        "tickets/<int:ticket_pk>/messages/",
        SupportMessageViewSet.as_view({"get": "list", "post": "create"}),
        name="support-ticket-messages",
    ),
]

