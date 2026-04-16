from rest_framework import status, viewsets
from rest_framework.response import Response


class WrappedViewSetMixin(viewsets.GenericViewSet):
    success_messages = {
        "list": "Records retrieved successfully.",
        "retrieve": "Record retrieved successfully.",
        "create": "Record created successfully.",
        "update": "Record updated successfully.",
        "partial_update": "Record updated successfully.",
        "destroy": "Record deleted successfully.",
    }

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if not hasattr(response, "data") or response.exception:
            return response
        if isinstance(response.data, dict) and {"success", "message"} <= set(response.data.keys()):
            return response

        action = getattr(self, "action", request.method.lower())
        message = self.success_messages.get(action, "Success")
        response.data = {
            "success": True,
            "message": message,
            "data": response.data,
        }
        return response


class WrappedModelViewSet(WrappedViewSetMixin, viewsets.ModelViewSet):
    pass


class WrappedReadOnlyModelViewSet(WrappedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    pass
