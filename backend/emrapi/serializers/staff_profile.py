from rest_framework import serializers

from emrapi.models import StaffProfile

from .base import ModelCleanSerializer
from .department import DepartmentSummarySerializer
from .user import UserSummarySerializer


class StaffProfileSummarySerializer(ModelCleanSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = StaffProfile
        fields = ['id', 'employee_code', 'full_name', 'role', 'role_display']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class StaffProfileSerializer(ModelCleanSerializer):
    user_detail = UserSummarySerializer(source='user', read_only=True)
    department_detail = DepartmentSummarySerializer(source='department', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            'id',
            'user',
            'user_detail',
            'department',
            'department_detail',
            'role',
            'role_display',
            'employee_code',
            'phone',
            'gender',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user_detail',
            'department_detail',
            'role_display',
            'created_at',
            'updated_at',
        ]
