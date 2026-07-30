from rest_framework import serializers

from emrapi.models import ReceptionistProfile

from .base import ModelCleanSerializer
from .staff_profile import StaffProfileSummarySerializer


class ReceptionistProfileSerializer(ModelCleanSerializer):
    staff_detail = StaffProfileSummarySerializer(source='staff', read_only=True)
    years_of_experience = serializers.IntegerField(read_only=True)

    class Meta:
        model = ReceptionistProfile
        fields = [
            'id',
            'staff',
            'staff_detail',
            'counter_number',
            'shift',
            'assigned_area',
            'handles_health_insurance',
            'career_start_date',
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
