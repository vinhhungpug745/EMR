from django.db import transaction
from rest_framework import filters, viewsets,generics
from rest_framework.exceptions import ValidationError

from emrapi.models import Encounter, VitalSign
from emrapi.audit import AuditTrailMixin
from emrapi.permission import IsNurseOrAdmin
from emrapi.serializers import VitalSignSerializer, VitalSignQueueSerializer


class VitalSignViewSet(AuditTrailMixin, viewsets.ModelViewSet):
    queryset = (
        VitalSign.objects
        .filter(active=True)
        .select_related(
            'encounter',
            'encounter__visit',
            'encounter__visit__medical_record',
            'encounter__visit__medical_record__patient',
            'encounter__department',
            'recorded_by',
            'recorded_by__user',
        )
    )

    serializer_class = VitalSignSerializer
    permission_classes = [IsNurseOrAdmin]

    filter_backends = [filters.SearchFilter,filters.OrderingFilter,]

    search_fields = [
        'encounter__visit__visit_number',
        'encounter__visit__medical_record__patient__full_name',
        'encounter__visit__medical_record__patient__phone',
        'encounter__department__name',
    ]

    ordering_fields = [
        'created_at',
        'updated_at',
        'temperature',
        'pulse',
    ]
    ordering = ['-created_at']

    http_method_names = ['get','post','patch','head', 'options',]

    def get_queryset(self):
        queryset = super().get_queryset()
        encounter_id = self.request.query_params.get('encounter')
        if encounter_id:
            queryset = queryset.filter(
                encounter_id=encounter_id,
            )

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        encounter_id = serializer.validated_data['encounter'].pk
        department = serializer.validated_data.pop('department', None)

        encounter = (
            Encounter.objects
            .select_for_update()
            .get(pk=encounter_id)
        )

        if not encounter.active:
            raise ValidationError({
                'encounter': 'Lượt khám này đã ngừng hoạt động.'
            })

        can_record = encounter.status in [
            Encounter.Status.CHECKED_IN,
            Encounter.Status.VITALS_RECHECK,
        ]

        if not can_record:
            raise ValidationError({
                'encounter': 'Không thể ghi sinh hiệu cho lượt khám này.'
            })

        if department and encounter.department_id != department.id:
            encounter.department = department

        vital_sign = serializer.save(encounter=encounter,)

        if encounter.status == Encounter.Status.CHECKED_IN:
            encounter.status = Encounter.Status.VITALS_DONE
        else:
            encounter.status = Encounter.Status.IN_PROGRESS

        encounter.save(update_fields=['department', 'status', 'updated_at'])

        return vital_sign

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.instance
        if not instance.active:
            raise ValidationError(
                'Bản ghi sinh hiệu này đã ngừng hoạt động.'
            )
        serializer.save()


class VitalSignQueueView(AuditTrailMixin, generics.ListAPIView):
    serializer_class = VitalSignQueueSerializer
    permission_classes = [IsNurseOrAdmin]

    queryset = (
        Encounter.objects
        .filter(
            active=True,
            status__in=[
                Encounter.Status.CHECKED_IN,
                Encounter.Status.VITALS_RECHECK,
            ],
        )
        .select_related(
            'visit',
            'visit__medical_record',
            'visit__medical_record__patient',
            'department',
        )
    )

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = [
        'visit__visit_number',
        'visit__medical_record__patient__full_name',
        'visit__medical_record__patient__phone',
        'department__name',
    ]

    ordering_fields = ['visit__arrived_at', 'started_at', 'created_at']
    ordering = ['visit__arrived_at']
