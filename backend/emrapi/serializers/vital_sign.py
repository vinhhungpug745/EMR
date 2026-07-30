from rest_framework import serializers

from emrapi.models import VitalSign

from .base import ModelCleanSerializer, get_request_staff
from .encounter import EncounterSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class VitalSignSerializer(ModelCleanSerializer):
    encounter_detail = EncounterSummarySerializer(source='encounter', read_only=True)
    recorded_by_detail = StaffProfileSummarySerializer(
        source='recorded_by',
        read_only=True,
    )

    class Meta:
        model = VitalSign
        fields = [
            'id',
            'encounter',
            'encounter_detail',
            'recorded_by',
            'recorded_by_detail',
            'temperature',
            'pulse',
            'systolic_bp',
            'diastolic_bp',
            'respiratory_rate',
            'height_cm',
            'weight_kg',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'encounter_detail',
            'recorded_by',
            'recorded_by_detail',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        systolic = attrs.get('systolic_bp', getattr(self.instance, 'systolic_bp', None))
        diastolic = attrs.get('diastolic_bp', getattr(self.instance, 'diastolic_bp', None))
        if systolic and diastolic and systolic <= diastolic:
            raise serializers.ValidationError(
                {'systolic_bp': 'Huyet ap tam thu phai lon hon huyet ap tam truong.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data['recorded_by'] = get_request_staff(self)
        return super().create(validated_data)
