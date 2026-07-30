from django.contrib.auth.models import User
from rest_framework import serializers

from .department import DepartmentSummarySerializer


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(trim_whitespace=True)
    password = serializers.CharField(trim_whitespace=False, write_only=True)


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
