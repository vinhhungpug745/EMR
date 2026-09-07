from django.db.models import Prefetch
from rest_framework import filters, viewsets

from emrapi.models import Encounter, LabTest, MedicalRecord, Prescription, Visit
from emrapi.permission import IsDoctorOrAdmin
from emrapi.serializers import MedicalRecordSerializer, MedicalRecordSummarySerializer


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = (
        MedicalRecord.objects
        .filter(active=True)
        .select_related(
            'patient',
            'created_by',
            'created_by__user',
        )
    )
    permission_classes = [IsDoctorOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'record_number',
        'patient__full_name',
        'patient__phone',
        'patient__citizen_id',
        'patient__health_insurance_code',
        'blood_type',
        'allergies',
        'medical_history',
    ]
    ordering_fields = [
        'record_number',
        'patient__full_name',
        'created_at',
        'updated_at',
    ]
    ordering = ['record_number']
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action != 'retrieve':
            encounter_queryset = Encounter.objects.select_related(
                'department',
            )
            visit_queryset = Visit.objects.prefetch_related(
                Prefetch('encounters', queryset=encounter_queryset),
            )

            return queryset.prefetch_related(
                Prefetch('visits', queryset=visit_queryset),
            )

        prescription_queryset = (
            Prescription.objects
            .exclude(status=Prescription.Status.CANCELLED)
            .prefetch_related('items', 'items__medication')
        )
        lab_test_queryset = LabTest.objects.select_related('test_catalog')
        encounter_queryset = (
            Encounter.objects
            .select_related(
                'department',
                'doctor',
                'doctor__staff',
                'doctor__staff__user',
            )
            .prefetch_related(
                'vital_signs',
                Prefetch('lab_tests', queryset=lab_test_queryset),
                Prefetch('prescriptions', queryset=prescription_queryset),
            )
        )
        visit_queryset = Visit.objects.prefetch_related(
            Prefetch('encounters', queryset=encounter_queryset),
        )

        return queryset.prefetch_related(
            Prefetch('visits', queryset=visit_queryset),
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return MedicalRecordSummarySerializer
        return MedicalRecordSerializer
