from rest_framework.response import Response


def api_response(*, data=None, message="Success", success=True, status_code=200):
    return Response({"success": success, "message": message, "data": data}, status=status_code)
