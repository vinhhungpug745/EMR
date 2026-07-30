from rest_framework import serializers

from emrapi.models import Appointment

from .base import ModelCleanSerializer, get_request_staff
from .doctor_profile import DoctorProfileSummarySerializer
from .patient import PatientSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class AppointmentSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'scheduled_at', 'reason', 'status']
        read_only_fields = fields


class AppointmentSerializer(ModelCleanSerializer):
    patient_detail = PatientSummarySerializer(source='patient', read_only=True)
    doctor_detail = DoctorProfileSummarySerializer(source='doctor', read_only=True)
    created_by_detail = StaffProfileSummarySerializer(source='created_by', read_only=True)
    checked_in_by_detail = StaffProfileSummarySerializer(
        source='checked_in_by',
        read_only=True,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_detail',
            'doctor',
            'doctor_detail',
            'scheduled_at',
            'reason',
            'status',
            'status_display',
            'note',
            'created_by',
            'created_by_detail',
            'checked_in_by',
            'checked_in_by_detail',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'patient_detail',
            'doctor_detail',
            'status_display',
            'created_by',
            'created_by_detail',
            'checked_in_by',
            'checked_in_by_detail',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        staff = get_request_staff(self)
        validated_data['created_by'] = staff
        if validated_data.get('status') == Appointment.Status.CHECKED_IN:
            validated_data['checked_in_by'] = staff
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if (
            validated_data.get('status') == Appointment.Status.CHECKED_IN
            and instance.status != Appointment.Status.CHECKED_IN
        ):
            validated_data['checked_in_by'] = get_request_staff(self)
        return super().update(instance, validated_data)
