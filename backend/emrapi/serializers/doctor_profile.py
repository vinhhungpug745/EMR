from rest_framework import serializers

from emrapi.models import DoctorProfile

from .base import ModelCleanSerializer
from .staff_profile import StaffProfileSummarySerializer


class DoctorProfileSummarySerializer(ModelCleanSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = ['id', 'full_name', 'specialty', 'consultation_room']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.staff.user.get_full_name() or obj.staff.user.username


class DoctorProfileSerializer(ModelCleanSerializer):
    staff_detail = StaffProfileSummarySerializer(source='staff', read_only=True)
    years_of_experience = serializers.IntegerField(read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'staff',
            'staff_detail',
            'specialty',
            'license_number',
            'academic_title',
            'degree',
            'license_issue_date',
            'license_issued_by',
            'practice_start_date',
            'years_of_experience',
            'scope_of_practice',
            'consultation_room',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'staff_detail',
            'years_of_experience',
            'created_at',
            'updated_at',
        ]
