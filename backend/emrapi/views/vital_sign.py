from django.db import transaction
from rest_framework import filters, viewsets,generics
from rest_framework.exceptions import ValidationError

from emrapi.models import Encounter, VitalSign
from emrapi.permission import IsAnyStaff
from emrapi.serializers import VitalSignSerializer, VitalSignQueueSerializer


class VitalSignViewSet(viewsets.ModelViewSet):
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
    permission_classes = [IsAnyStaff]

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
                'encounter': 'Luot kham nay da ngung hoat dong.'
            })

        allowed_statuses = [
            Encounter.Status.CHECKED_IN,
            Encounter.Status.VITALS_DONE,
            Encounter.Status.IN_PROGRESS,
        ]

        if encounter.status not in allowed_statuses:
            raise ValidationError({
                'encounter': 'Khong the ghi sinh hieu cho luot kham nay.'
            })

        if department and encounter.department_id != department.id:
            encounter.department = department

        vital_sign = serializer.save(encounter=encounter,)

        # Chỉ lần đo đầu tiên mới chuyển bệnh nhân
        # khỏi hàng đợi điều dưỡng
        if encounter.status == Encounter.Status.CHECKED_IN:
            encounter.status = Encounter.Status.VITALS_DONE

            encounter.save(
                update_fields=[
                    'department',
                    'status',
                    'updated_at',
                ]
            )
        elif department:
            encounter.save(
                update_fields=[
                    'department',
                    'updated_at',
                ]
            )

        return vital_sign

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.instance
        if not instance.active:
            raise ValidationError(
                'Ban ghi sinh hieu nay da ngung hoat dong.'
            )
        serializer.save()


class VitalSignQueueView(generics.ListAPIView):
    serializer_class = VitalSignQueueSerializer
    permission_classes = [IsAnyStaff]

    queryset = (
        Encounter.objects
        .filter(
            active=True,
            status=Encounter.Status.CHECKED_IN,
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
