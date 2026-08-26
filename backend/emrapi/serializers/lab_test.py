from django.utils import timezone
from rest_framework import serializers

from emrapi.models import LabTest

from .base import ModelCleanSerializer, get_request_staff
from .doctor_profile import DoctorProfileSummarySerializer
from .encounter import EncounterSummarySerializer
from .lab_test_catalog import LabTestCatalogSummarySerializer
from .lab_technician_profile import LabTechnicianProfileSummarySerializer


class LabTestSerializer(ModelCleanSerializer):
    encounter_detail = EncounterSummarySerializer(source='encounter', read_only=True)
    test_catalog_detail = LabTestCatalogSummarySerializer(
        source='test_catalog',
        read_only=True,
    )
    ordered_by_detail = DoctorProfileSummarySerializer(
        source='ordered_by',
        read_only=True,
    )
    performed_by_detail = LabTechnicianProfileSummarySerializer(
        source='performed_by',
        read_only=True,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LabTest
        fields = [
            'id',
            'encounter',
            'encounter_detail',
            'test_catalog',
            'test_catalog_detail',
            'ordered_by',
            'ordered_by_detail',
            'performed_by',
            'performed_by_detail',
            'ordered_at',
            'performed_at',
            'result',
            'status',
            'status_display',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'encounter_detail',
            'test_catalog_detail',
            'ordered_by',
            'ordered_by_detail',
            'performed_by',
            'performed_by_detail',
            'ordered_at',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]

    def validate_test_catalog(self, value):
        if not value.active:
            raise serializers.ValidationError(
                'Xet nghiem nay da ngung ap dung.'
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status = attrs.get('status', getattr(self.instance, 'status', None))
        result = attrs.get('result', getattr(self.instance, 'result', None))
        performed_by = attrs.get(
            'performed_by',
            getattr(self.instance, 'performed_by', None),
        )
        performed_at = attrs.get(
            'performed_at',
            getattr(self.instance, 'performed_at', None),
        )

        if status == LabTest.Status.COMPLETED:
            errors = {}
            if not result:
                errors['result'] = 'Xet nghiem hoan thanh phai co ket qua.'
            if not performed_by:
                staff = get_request_staff(self)
                if getattr(staff, 'lab_technician_profile', None) is None:
                    errors['performed_by'] = (
                        'Chi ky thuat vien moi duoc hoan thanh xet nghiem.'
                    )
            if not performed_at:
                attrs['performed_at'] = timezone.now()
            if errors:
                raise serializers.ValidationError(errors)
        return attrs

    def create(self, validated_data):
        staff = get_request_staff(self)
        doctor_profile = getattr(staff, 'doctor_profile', None)
        if doctor_profile is None:
            raise serializers.ValidationError({
                 'ordered_by': 'Chỉ bác sĩ mới được chỉ định xét nghiệm.'
            })
        validated_data['ordered_by'] = doctor_profile
        validated_data['status'] = LabTest.Status.ORDERED
        return super().create(validated_data)

    def update(self, instance, validated_data):
        status = validated_data.get('status', instance.status)
        if status in [LabTest.Status.PROCESSING, LabTest.Status.COMPLETED]:
            staff = get_request_staff(self)
            technician_profile = getattr(staff, 'lab_technician_profile', None)
            if technician_profile is None:
                raise serializers.ValidationError({
                    'performed_by': (
                        'Chỉ có nhân viên xét nghiệm mới được cập nhật quá trình xét nghiệm.'
                    )
                })
            validated_data['performed_by'] = technician_profile
        return super().update(instance, validated_data)
