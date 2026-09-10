from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from emrapi.models import StaffProfile
from emrapi.serializers.auth import (
    AuthenticatedUserSerializer,
    LoginSerializer,
    LogoutSerializer,
)


from emrapi.audit import AuditTrailMixin


class LoginView(AuditTrailMixin, TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer


class CurrentUserView(APIView):
    # Restoring an existing session is a background check, not a user action.
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            staff = request.user.staff_profile
        except StaffProfile.DoesNotExist:
            return Response(
                {'detail': 'Tai khoan chua duoc gan ho so nhan vien.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AuthenticatedUserSerializer(request.user)
        return Response({'user': serializer.data})


class LogoutView(AuditTrailMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            if str(token['user_id']) != str(request.user.pk):
                return Response(
                    {'detail': 'Refresh token khong thuoc tai khoan hien tai.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            token.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Refresh token khong hop le hoac da het han.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
