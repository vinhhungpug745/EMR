from rest_framework import serializers

from emrapi.models import NurseProfile

from .base import ModelCleanSerializer
from .staff_profile import StaffProfileSummarySerializer


class NurseProfileSerializer(ModelCleanSerializer):
    staff_detail = StaffProfileSummarySerializer(source='staff', read_only=True)
    years_of_experience = serializers.IntegerField(read_only=True)

    class Meta:
        model = NurseProfile
        fields = [
            'id',
            'staff',
            'staff_detail',
            'nursing_license_number',
            'care_unit',
            'professional_qualification',
            'professional_rank',
            'practice_start_date',
            'years_of_experience',
            'shift',
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
