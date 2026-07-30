from rest_framework import serializers

from emrapi.models import Encounter

from .appointment import AppointmentSummarySerializer
from .base import ModelCleanSerializer, get_request_staff
from .doctor_profile import DoctorProfileSummarySerializer
from .medical_record import MedicalRecordSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class EncounterSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = Encounter
        fields = ['id', 'visit_date', 'chief_complaint', 'status']
        read_only_fields = fields


class EncounterSerializer(ModelCleanSerializer):
    medical_record_detail = MedicalRecordSummarySerializer(
        source='medical_record',
        read_only=True,
    )
    appointment_detail = AppointmentSummarySerializer(
        source='appointment',
        read_only=True,
    )
    doctor_detail = DoctorProfileSummarySerializer(source='doctor', read_only=True)
    created_by_detail = StaffProfileSummarySerializer(source='created_by', read_only=True)
    encounter_type_display = serializers.CharField(
        source='get_encounter_type_display',
        read_only=True,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id',
            'medical_record',
            'medical_record_detail',
            'appointment',
            'appointment_detail',
            'doctor',
            'doctor_detail',
            'encounter_type',
            'encounter_type_display',
            'status',
            'status_display',
            'visit_date',
            'chief_complaint',
            'diagnosis',
            'treatment_plan',
            'follow_up_date',
            'created_by',
            'created_by_detail',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'medical_record_detail',
            'appointment_detail',
            'doctor_detail',
            'encounter_type_display',
            'status_display',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status = attrs.get('status', getattr(self.instance, 'status', None))
        diagnosis = attrs.get('diagnosis', getattr(self.instance, 'diagnosis', None))

        if status == Encounter.Status.COMPLETED and not diagnosis:
            raise serializers.ValidationError(
                {'diagnosis': 'Lan kham hoan thanh phai co chan doan.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data['created_by'] = get_request_staff(self)
        return super().create(validated_data)
