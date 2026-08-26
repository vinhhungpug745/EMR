from rest_framework import serializers

from emrapi.models import MedicalRecord

from .base import ModelCleanSerializer
from .patient import PatientSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class MedicalRecordSummarySerializer(ModelCleanSerializer):
    patient_detail = PatientSummarySerializer(source='patient', read_only=True)
    latest_visit = serializers.SerializerMethodField()
    latest_diagnosis = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = [
            'id',
            'record_number',
            'patient_detail',
            'blood_type',
            'allergies',
            'medical_history',
            'latest_visit',
            'latest_diagnosis',
            'active',
            'updated_at',
        ]
        read_only_fields = fields

    def get_latest_visit(self, obj):
        visit = self._get_latest_visit(obj)

        if not visit:
            return None

        return {
            'id': visit.id,
            'visit_number': visit.visit_number,
            'arrived_at': visit.arrived_at,
            'reason': visit.reason,
            'status': visit.status,
            'status_display': visit.get_status_display(),
            'encounter_count': visit.encounters.count(),
        }

    def get_latest_diagnosis(self, obj):
        visit = self._get_latest_visit(obj)

        if not visit:
            return None

        encounters = [
            encounter
            for encounter in visit.encounters.all()
            if encounter.diagnosis
        ]

        encounter = max(
            encounters,
            key=lambda item: item.completed_at or item.started_at or item.created_at,
            default=None,
        )

        if not encounter:
            return None

        return {
            'department_name': (
                encounter.department.name
                if encounter.department
                else None
            ),
            'diagnosis': encounter.diagnosis,
        }

    def _get_latest_visit(self, obj):
        visits = list(obj.visits.all())

        if not visits:
            return None

        return max(visits, key=lambda visit: visit.arrived_at)


class MedicalRecordSerializer(ModelCleanSerializer):
    patient_detail = PatientSummarySerializer(source='patient', read_only=True)
    created_by_detail = StaffProfileSummarySerializer(source='created_by', read_only=True)
    visits = serializers.SerializerMethodField()

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
            'visits',
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
            'visits',
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

    def get_visits(self, obj):
        visits = obj.visits.all().order_by('-arrived_at')

        return [
            {
                'id': visit.id,
                'visit_number': visit.visit_number,
                'visit_type': visit.visit_type,
                'visit_type_display': visit.get_visit_type_display(),
                'arrived_at': visit.arrived_at,
                'completed_at': visit.completed_at,
                'reason': visit.reason,
                'status': visit.status,
                'status_display': visit.get_status_display(),
                'note': visit.note,
                'encounters': [
                    self._serialize_encounter(encounter)
                    for encounter in visit.encounters.all().order_by(
                        'started_at',
                        'created_at',
                    )
                ],
            }
            for visit in visits
        ]

    def _serialize_encounter(self, encounter):
        vital_signs = encounter.vital_signs.all().order_by('-created_at')
        lab_tests = encounter.lab_tests.all().order_by('-ordered_at')
        prescriptions = encounter.prescriptions.all().order_by('-created_at')

        return {
            'id': encounter.id,
            'department_name': (
                encounter.department.name
                if encounter.department
                else None
            ),
            'doctor_name': (
                encounter.doctor.staff.user.get_full_name()
                or encounter.doctor.staff.user.username
                if encounter.doctor
                else None
            ),
            'status': encounter.status,
            'status_display': encounter.get_status_display(),
            'started_at': encounter.started_at,
            'completed_at': encounter.completed_at,
            'chief_complaint': encounter.chief_complaint,
            'diagnosis': encounter.diagnosis,
            'treatment_plan': encounter.treatment_plan,
            'follow_up_date': encounter.follow_up_date,
            'vital_signs': [
                {
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
                for vital_sign in vital_signs
            ],
            'lab_tests': [
                {
                    'id': lab_test.id,
                    'name': lab_test.test_catalog.name,
                    'status': lab_test.status,
                    'status_display': lab_test.get_status_display(),
                    'ordered_at': lab_test.ordered_at,
                    'performed_at': lab_test.performed_at,
                    'result': lab_test.result,
                }
                for lab_test in lab_tests
            ],
            'prescriptions': [
                {
                    'id': prescription.id,
                    'status': prescription.status,
                    'status_display': prescription.get_status_display(),
                    'note': prescription.note,
                    'created_at': prescription.created_at,
                    'items': [
                        {
                            'id': item.id,
                            'medication_name': (
                                item.medication.name
                                if item.medication
                                else None
                            ),
                            'dosage': item.dosage,
                            'frequency': item.frequency,
                            'duration': item.duration,
                            'quantity': item.quantity,
                            'instruction': item.instruction,
                        }
                        for item in prescription.items.all()
                    ],
                }
                for prescription in prescriptions
            ],
        }
