from rest_framework import serializers

from emrapi.models import MedicalRecord

from .base import ModelCleanSerializer
from .patient import PatientSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class MedicalRecordSummarySerializer(ModelCleanSerializer):
    patient_detail = PatientSummarySerializer(source='patient', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = ['id', 'record_number', 'patient_detail']
        read_only_fields = fields


class MedicalRecordSerializer(ModelCleanSerializer):
    patient_detail = PatientSummarySerializer(source='patient', read_only=True)
    created_by_detail = StaffProfileSummarySerializer(source='created_by', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id',
            'patient',
            'patient_detail',
            'record_number',
            'blood_type',
            'allergies',
            'medical_history',
            'created_by',
            'created_by_detail',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'patient',
            'patient_detail',
            'record_number',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        raise serializers.ValidationError({
            'detail': (
                'Ho so benh an duoc tao tu dong khi tao benh nhan, '
                'khong duoc tao truc tiep.'
            )
        })
