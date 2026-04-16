from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "success": False,
                "message": "An unexpected error occurred.",
                "errors": ["internal_server_error"],
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    message = "Request failed."
    if isinstance(response.data, dict):
        detail = response.data.get("detail")
        if isinstance(detail, str):
            message = detail
        elif response.data:
            first_entry = next(iter(response.data.items()), None)
            if first_entry is not None:
                field, value = first_entry
                if isinstance(value, list) and value:
                    message = f"{field}: {value[0]}"
                elif isinstance(value, str):
                    message = f"{field}: {value}"

    response.data = {
        "success": False,
        "message": message,
        "errors": response.data,
    }
    return response
