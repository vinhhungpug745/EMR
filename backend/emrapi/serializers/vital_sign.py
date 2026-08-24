from rest_framework import serializers

from emrapi.models import VitalSign, Encounter

from .base import ModelCleanSerializer, get_request_staff
from .encounter import EncounterSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class VitalSignSerializer(ModelCleanSerializer):
    encounter_detail = EncounterSummarySerializer(source='encounter', read_only=True)
    recorded_by_detail = StaffProfileSummarySerializer(
        source='recorded_by',
        read_only=True,
    )
    visit_number = serializers.CharField(
        source='encounter.visit.visit_number',
        read_only=True,
    )
    patient_name = serializers.CharField(
        source='encounter.visit.medical_record.patient.full_name',
        read_only=True,
    )


    class Meta:
        model = VitalSign
        fields = [
            'id',
            'encounter',
            'encounter_detail',
            'visit_number',
            'patient_name',
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
            'visit_number',
            'patient_name',
            'recorded_by',
            'recorded_by_detail',
            'created_at',
            'updated_at',
        ]

    def validate_encounter(self, encounter):
        # Khi PATCH thì không cho chuyển sinh hiệu
        # sang Encounter khác
        if self.instance:
            if encounter != self.instance.encounter:
                raise serializers.ValidationError(
                    'Khong duoc thay doi luot kham cua ban ghi sinh hieu.'
                )

            return encounter

        # Khi tạo mới, bệnh nhân phải đang chờ đo sinh hiệu
        if encounter.status != Encounter.Status.CHECKED_IN:
            raise serializers.ValidationError(
                'Benh nhan khong o trang thai cho do sinh hieu.'
            )

        if not encounter.active:
            raise serializers.ValidationError(
                'Luot kham nay da ngung hoat dong.'
            )

        return encounter

    def validate(self, attrs):
        attrs = super().validate(attrs)

        systolic = attrs.get(
            'systolic_bp',
            getattr(self.instance, 'systolic_bp', None),
        )

        diastolic = attrs.get(
            'diastolic_bp',
            getattr(self.instance, 'diastolic_bp', None),
        )

        if (
                systolic is not None
                and diastolic is not None
                and systolic <= diastolic
        ):
            raise serializers.ValidationError({
                'systolic_bp':
                    'Huyet ap tam thu phai lon hon huyet ap tam truong.'
            })

        return attrs

    def create(self, validated_data):
        validated_data['recorded_by'] = get_request_staff(self)

        return super().create(validated_data)



class NurseQueueSerializer(serializers.ModelSerializer):
    visit_number = serializers.CharField(source='visit.visit_number',read_only=True,)
    patient_name = serializers.CharField(source='visit.medical_record.patient.full_name',read_only=True,)
    patient_phone = serializers.CharField(source='visit.medical_record.patient.phone',read_only=True,)
    date_of_birth = serializers.DateField(source='visit.medical_record.patient.date_of_birth',read_only=True,)
    gender = serializers.CharField(source='visit.medical_record.patient.gender',read_only=True,)
    department_name = serializers.CharField(source='department.name',read_only=True,)
    status_display = serializers.CharField(source='get_status_display',read_only=True,)
    arrived_at = serializers.DateTimeField(source='visit.arrived_at',read_only=True,)

    class Meta:
        model = Encounter
        fields = [
            'id',
            'visit',
            'visit_number',
            'patient_name',
            'patient_phone',
            'date_of_birth',
            'gender',
            'department_name',
            'chief_complaint',
            'status',
            'status_display',
            'arrived_at',
        ]
        read_only_fields = fields