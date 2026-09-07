from django.utils import timezone
from rest_framework import serializers

from emrapi.models import Encounter, VitalSign

from .base import ModelCleanSerializer, get_request_staff
from .department import DepartmentSummarySerializer
from .doctor_profile import DoctorProfileSummarySerializer
from .staff_profile import StaffProfileSummarySerializer
from .visit import VisitSummarySerializer


class EncounterSummarySerializer(ModelCleanSerializer):
    visit_number = serializers.CharField(source='visit.visit_number', read_only=True)
    patient_name = serializers.CharField(
        source='visit.medical_record.patient.full_name',
        read_only=True,
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id',
            'visit_number',
            'patient_name',
            'department_name',
            'doctor_name',
            'started_at',
            'chief_complaint',
            'status',
            'status_display',
        ]
        read_only_fields = fields

    def get_doctor_name(self, obj):
        if not obj.doctor_id:
            return None
        return obj.doctor.staff.user.get_full_name() or obj.doctor.staff.user.username


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
    latest_vital_sign = serializers.SerializerMethodField()

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
            'latest_vital_sign',
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
            'latest_vital_sign',
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

    def get_latest_vital_sign(self, obj):
        vital_sign = (
            VitalSign.objects
            .filter(
                encounter__visit=obj.visit,
                active=True,
            )
            .order_by('-created_at')
            .first()
        )

        if not vital_sign:
            return None

        return {
            'id': vital_sign.id,
            'temperature': vital_sign.temperature,
            'pulse': vital_sign.pulse,
            'systolic_bp': vital_sign.systolic_bp,
            'diastolic_bp': vital_sign.diastolic_bp,
            'respiratory_rate': vital_sign.respiratory_rate,
            'height_cm': vital_sign.height_cm,
            'weight_kg': vital_sign.weight_kg,
            'created_at': vital_sign.created_at,
        }


    def update(self,instance,validated_data):
        status = validated_data.get('status')
        if status == Encounter.Status.IN_PROGRESS:
            staff = get_request_staff(self)
            doctor_profile = getattr(staff, 'doctor_profile', None)

            if not staff or staff.role != staff.Role.DOCTOR or not doctor_profile:
                raise serializers.ValidationError({
                    'Status': 'Chỉ bác sĩ mới được bắt đầu khám'
                })

            has_vital_sign = VitalSign.objects.filter(
                encounter__visit=instance.visit,
                active=True,
            ).exists()

            if not has_vital_sign:
                raise serializers.ValidationError({
                    'status': 'Chỉ bắt đầu khám sau khi đã đo sinh hiệu.'
                })

            if not instance.started_at:
                validated_data['started_at'] = timezone.now()

            if not instance.doctor_id:
                validated_data['doctor'] = doctor_profile
        return super().update(instance,validated_data)

class ConsultationQueueSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='visit.medical_record.patient.full_name',read_only=True,)
    patient_phone = serializers.CharField(source='visit.medical_record.patient.phone',read_only=True,)
    visit_number = serializers.CharField(source='visit.visit_number',read_only=True,)
    arrived_at = serializers.DateTimeField(source='visit.arrived_at',read_only=True,)
    reason = serializers.CharField(source='visit.reason',read_only=True,)
    department_name = serializers.CharField(source='department.name',read_only=True,)
    latest_vital_sign = serializers.SerializerMethodField()

    class Meta:
        model = Encounter
        fields = [
            'id',
            'patient_name',
            'patient_phone',
            'visit_number',
            'arrived_at',
            'reason',
            'department',
            'department_name',
            'status',
            'chief_complaint',
            'latest_vital_sign',
            'created_at',
        ]

    def get_latest_vital_sign(self, obj):
        vital_sign = (
            VitalSign.objects
            .filter(
                encounter__visit=obj.visit,
                active=True,
            )
            .order_by('-created_at')
            .first()
        )

        if not vital_sign:
            return None

        return {
            'id': vital_sign.id,
            'temperature': vital_sign.temperature,
            'pulse': vital_sign.pulse,
            'systolic_bp': vital_sign.systolic_bp,
            'diastolic_bp': vital_sign.diastolic_bp,
            'respiratory_rate': vital_sign.respiratory_rate,
            'height_cm': vital_sign.height_cm,
            'weight_kg': vital_sign.weight_kg,
            'created_at': vital_sign.created_at,
        }
