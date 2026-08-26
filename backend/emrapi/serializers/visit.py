from django.utils import timezone
from rest_framework import serializers

from emrapi.models import Visit

from .base import ModelCleanSerializer, get_request_staff
from .medical_record import MedicalRecordSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class VisitSummarySerializer(ModelCleanSerializer):
    patient_name = serializers.CharField(
        source='medical_record.patient.full_name',
        read_only=True,
    )

    class Meta:
        model = Visit
        fields = [
            'id',
            'visit_number',
            'patient_name',
            'arrived_at',
            'reason',
            'status',
        ]
        read_only_fields = fields


class VisitSerializer(ModelCleanSerializer):
    medical_record_detail = MedicalRecordSummarySerializer(
        source='medical_record',
        read_only=True,
    )
    created_by_detail = StaffProfileSummarySerializer(source='created_by', read_only=True)
    visit_type_display = serializers.CharField(source='get_visit_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Visit
        fields = [
            'id',
            'visit_number',
            'medical_record',
            'medical_record_detail',
            'visit_type',
            'visit_type_display',
            'arrived_at',
            'completed_at',
            'reason',
            'status',
            'status_display',
            'note',
            'created_by',
            'created_by_detail',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'visit_number',
            'medical_record_detail',
            'visit_type_display',
            'status_display',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        status = attrs.get('status', getattr(self.instance, 'status', None))
        completed_at = attrs.get(
            'completed_at',
            getattr(self.instance, 'completed_at', None),
        )
        if status == Visit.Status.COMPLETED and not completed_at:
            attrs['completed_at'] = timezone.now()
        return super().validate(attrs)

    def create(self, validated_data):
        validated_data['created_by'] = get_request_staff(self)
        return super().create(validated_data)
