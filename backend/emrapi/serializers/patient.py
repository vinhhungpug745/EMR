from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from emrapi.models import MedicalRecord, Patient

from .base import ModelCleanSerializer


class PatientSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'full_name', 'date_of_birth', 'gender', 'phone']
        read_only_fields = fields


class PatientSerializer(ModelCleanSerializer):
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    medical_record_id = serializers.IntegerField(
        source='medical_record.id',
        read_only=True,
    )
    record_number = serializers.CharField(
        source='medical_record.record_number',
        read_only=True,
    )

    class Meta:
        model = Patient
        fields = [
            'id',
            'full_name',
            'date_of_birth',
            'gender',
            'gender_display',
            'phone',
            'email',
            'address',
            'citizen_id',
            'health_insurance_code',
            'emergency_contact_name',
            'emergency_contact_phone',
            'medical_record_id',
            'record_number',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'gender_display',
            'medical_record_id',
            'record_number',
            'created_at',
            'updated_at',
        ]

    def validate_date_of_birth(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError('Ngay sinh khong duoc nam trong tuong lai.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        patient = super().create(validated_data)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        created_by = (
            getattr(user, 'staff_profile', None)
            if user and user.is_authenticated
            else None
        )
        MedicalRecord.objects.create(
            patient=patient,
            record_number=f'EMR-{timezone.localdate():%Y}-{patient.pk:06d}',
            created_by=created_by,
        )
        return patient
