"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework import permissions
from rest_framework.schemas import get_schema_view

from apps.common.views import HealthCheckView, PublicPlatformStatsView, SchemaUnavailableView

try:
    import inflection  # noqa: F401
except ImportError:
    inflection = None

if inflection is not None:
    schema_view = get_schema_view(
        title="Manochitta Sathi API",
        description="Backend API for the Manochitta Sathi mental wellbeing platform.",
        version="1.0.0",
        public=True,
        permission_classes=[permissions.AllowAny],
    )
else:
    schema_view = SchemaUnavailableView.as_view()

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("api/schema/", schema_view, name="api-schema"),
    path("api/v1/public/stats/", PublicPlatformStatsView.as_view(), name="public-platform-stats"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/profiles/", include("apps.profiles.urls")),
    path("api/v1/therapists/", include("apps.therapists.urls")),
    path("api/v1/appointments/", include("apps.appointments.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/mood/", include("apps.mood.urls")),
    path("api/v1/resources/", include("apps.resources.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/feedback/", include("apps.feedback.urls")),
    path("api/v1/patient-records/", include("apps.patient_records.urls")),
    path("api/v1/packages/", include("apps.packages.urls")),
    path("api/v1/support/", include("apps.support.urls")),
    path("api/v1/admin-actions/", include("apps.auditlog.urls")),
    path("api/v1/communications/", include("apps.communications.urls")),
    path("api/v1/ai/", include("apps.ai.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
