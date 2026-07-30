from rest_framework import serializers

from emrapi.models import LabTechnicianProfile

from .base import ModelCleanSerializer
from .staff_profile import StaffProfileSummarySerializer


class LabTechnicianProfileSummarySerializer(ModelCleanSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = LabTechnicianProfile
        fields = ['id', 'full_name', 'laboratory_unit', 'specialization']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.staff.user.get_full_name() or obj.staff.user.username


class LabTechnicianProfileSerializer(ModelCleanSerializer):
    staff_detail = StaffProfileSummarySerializer(source='staff', read_only=True)
    years_of_experience = serializers.IntegerField(read_only=True)

    class Meta:
        model = LabTechnicianProfile
        fields = [
            'id',
            'staff',
            'staff_detail',
            'laboratory_unit',
            'certification_number',
            'specialization',
            'professional_qualification',
            'practice_start_date',
            'years_of_experience',
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
