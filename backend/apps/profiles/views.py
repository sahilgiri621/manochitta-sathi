from rest_framework.views import APIView

from apps.common.responses import api_response

from .serializers import UserProfileSerializer


class MyProfileView(APIView):
    def get(self, request):
        return api_response(data=UserProfileSerializer(request.user.profile).data, message="Profile retrieved successfully.")

    def put(self, request):
        serializer = UserProfileSerializer(request.user.profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(data=serializer.data, message="Profile updated successfully.")

    def patch(self, request):
        serializer = UserProfileSerializer(request.user.profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(data=serializer.data, message="Profile updated successfully.")
