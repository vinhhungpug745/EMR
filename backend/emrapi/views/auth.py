from django.contrib.auth import authenticate
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from emrapi.models import StaffProfile
from emrapi.serializers.auth import AuthenticatedUserSerializer, LoginSerializer


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request=request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'detail': 'Ten dang nhap hoac mat khau khong dung.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            staff = user.staff_profile
        except StaffProfile.DoesNotExist:
            return Response(
                {'detail': 'Tai khoan chua duoc gan ho so nhan vien.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not staff.active:
            return Response(
                {'detail': 'Ho so nhan vien da ngung hoat dong.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': AuthenticatedUserSerializer(user).data,
        })


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            staff = request.user.staff_profile
        except StaffProfile.DoesNotExist:
            return Response(
                {'detail': 'Tai khoan chua duoc gan ho so nhan vien.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not staff.active:
            return Response(
                {'detail': 'Ho so nhan vien da ngung hoat dong.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AuthenticatedUserSerializer(request.user)
        return Response({'user': serializer.data})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if isinstance(request.auth, Token):
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
