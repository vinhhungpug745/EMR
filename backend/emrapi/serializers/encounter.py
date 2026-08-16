from django.utils import timezone
from rest_framework import serializers

from emrapi.models import Encounter

from .base import ModelCleanSerializer, get_request_staff
from .department import DepartmentSummarySerializer
from .doctor_profile import DoctorProfileSummarySerializer
from .staff_profile import StaffProfileSummarySerializer
from .visit import VisitSummarySerializer


class EncounterSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = Encounter
        fields = ['id', 'started_at', 'chief_complaint', 'status']
        read_only_fields = fields


class EncounterSerializer(ModelCleanSerializer):
    visit_detail = VisitSummarySerializer(source='visit', read_only=True)
    parent_encounter_detail = EncounterSummarySerializer(
        source='parent_encounter',
        read_only=True,
    )
    department_detail = DepartmentSummarySerializer(source='department', read_only=True)
    doctor_detail = DoctorProfileSummarySerializer(source='doctor', read_only=True)
    created_by_detail = StaffProfileSummarySerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id',
            'visit',
            'visit_detail',
            'parent_encounter',
            'parent_encounter_detail',
            'department',
            'department_detail',
            'doctor',
            'doctor_detail',
            'status',
            'status_display',
            'started_at',
            'completed_at',
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
            'visit_detail',
            'parent_encounter_detail',
            'department_detail',
            'doctor_detail',
            'status_display',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        status = attrs.get('status', getattr(self.instance, 'status', None))
        diagnosis = attrs.get('diagnosis', getattr(self.instance, 'diagnosis', None))
        completed_at = attrs.get(
            'completed_at',
            getattr(self.instance, 'completed_at', None),
        )

        if status == Encounter.Status.COMPLETED and not diagnosis:
            raise serializers.ValidationError(
                {'diagnosis': 'Lan kham hoan thanh phai co chan doan.'}
            )
        if status == Encounter.Status.COMPLETED and not completed_at:
            attrs['completed_at'] = timezone.now()
        return super().validate(attrs)

    def create(self, validated_data):
        validated_data['created_by'] = get_request_staff(self)
        return super().create(validated_data)
