from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from emrapi.models import StaffProfile

from .base import ModelCleanSerializer
from .department import DepartmentSummarySerializer
from .user import UserSummarySerializer


class ProfessionalProfileMixin:
    def get_professional_profile(self, obj):
        if obj.role == StaffProfile.Role.DOCTOR:
            from .doctor_profile import DoctorProfileSerializer
            try:
                profile = obj.doctor_profile
            except ObjectDoesNotExist:
                return None
            return DoctorProfileSerializer(profile, context=self.context).data

        if obj.role == StaffProfile.Role.NURSE:
            from .nurse_profile import NurseProfileSerializer
            try:
                profile = obj.nurse_profile
            except ObjectDoesNotExist:
                return None
            return NurseProfileSerializer(profile, context=self.context).data

        if obj.role == StaffProfile.Role.RECEPTIONIST:
            from .receptionist_profile import ReceptionistProfileSerializer
            try:
                profile = obj.receptionist_profile
            except ObjectDoesNotExist:
                return None
            return ReceptionistProfileSerializer(profile, context=self.context).data

        if obj.role == StaffProfile.Role.LAB_TECHNICIAN:
            from .lab_technician_profile import LabTechnicianProfileSerializer
            try:
                profile = obj.lab_technician_profile
            except ObjectDoesNotExist:
                return None
            return LabTechnicianProfileSerializer(profile, context=self.context).data

        return None


class StaffProfileSummarySerializer(ModelCleanSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = StaffProfile
        fields = ['id', 'employee_code', 'full_name', 'role', 'role_display', 'active']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class StaffProfileSerializer(ProfessionalProfileMixin,ModelCleanSerializer):
    user_detail = UserSummarySerializer(source='user', read_only=True)
    department_detail = DepartmentSummarySerializer(source='department', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    professional_profile = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = [
            'id',
            'user_detail',
            'department_detail',
            'role',
            'role_display',
            'employee_code',
            'phone',
            'gender',
            'active',
            'professional_profile',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'role',
            'user_detail',
            'department_detail',
            'role_display',
            'created_at',
            'updated_at',
        ]

    def validate_active(self, value):
        request = self.context.get('request')
        if (
            value is False
            and request
            and self.instance
            and self.instance.user_id == request.user.id
        ):
            raise serializers.ValidationError(
                'Khong the khoa ho so nhan vien dang dang nhap.'
            )
        return value


class MyProfileSerializer(ProfessionalProfileMixin,ModelCleanSerializer):
    user_detail = UserSummarySerializer(source='user',read_only=True)
    department_detail = DepartmentSummarySerializer(source='department',read_only=True)
    role_display = serializers.CharField(source='get_role_display',read_only=True)

    professional_profile = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile

        fields = [
            'id',
            'user_detail',
            'department_detail',
            'role',
            'role_display',
            'employee_code',
            'phone',
            'gender',
            'active',
            'professional_profile',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'user_detail',
            'department_detail',
            'role',
            'role_display',
            'employee_code',
            'professional_profile',
            'active',
            'created_at',
            'updated_at',
        ]
