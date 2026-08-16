from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from emrapi.models import StaffProfile
from .department import DepartmentSummarySerializer


class AuthenticatedUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    staff_id = serializers.IntegerField(source='staff_profile.id', read_only=True)
    employee_code = serializers.CharField(
        source='staff_profile.employee_code',
        read_only=True,
    )
    role = serializers.CharField(source='staff_profile.role', read_only=True)
    role_display = serializers.CharField(
        source='staff_profile.get_role_display',
        read_only=True,
    )
    gender = serializers.CharField(source='staff_profile.gender', read_only=True)
    department = DepartmentSummarySerializer(
        source='staff_profile.department',
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'email',
            'staff_id',
            'employee_code',
            'role',
            'role_display',
            'gender',
            'department',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class LoginSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Ten dang nhap hoac mat khau khong dung.',
    }

    def validate(self, attrs):
        data = super().validate(attrs)

        try:
            staff = self.user.staff_profile
        except StaffProfile.DoesNotExist as exc:
            raise PermissionDenied(
                'Tai khoan chua duoc gan ho so nhan vien.',
                code='missing_staff_profile',
            ) from exc

        if not staff.active:
            raise PermissionDenied(
                'Ho so nhan vien da ngung hoat dong.',
                code='inactive_staff_profile',
            )

        data['user'] = AuthenticatedUserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(trim_whitespace=False, write_only=True)
