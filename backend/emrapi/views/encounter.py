from rest_framework import viewsets, filters, generics

from emrapi.models  import Encounter
from emrapi.permission import IsAnyStaff
from emrapi.serializers import EncounterSerializer, EncounterSummarySerializer, ConsultationQueueSerializer

class EncounterViewSet(viewsets.ModelViewSet):
    queryset = Encounter.objects.select_related(
        'visit',
        'visit__medical_record',
        'visit__medical_record__patient',
        'department',
        'doctor',
        'doctor__staff',
        'doctor__staff__user',
        'created_by',
    ).prefetch_related('vital_signs')
    permission_classes = [IsAnyStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'chief_complaint',
        'visit__visit_number',
        'visit__medical_record__patient__full_name',
        'visit__medical_record__patient__phone',
        'department__name',
    ]
    ordering_fields = ['started_at', 'status', 'created_at']
    ordering = ['-started_at']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        staff = getattr(self.request.user, 'staff_profile', None)
        status = self.request.query_params.get('status')

        if status:
            queryset = queryset.filter(status=status)

        if staff and staff.role == staff.Role.DOCTOR:
            if not staff.department_id:
                return queryset.none()

            queryset = queryset.filter(department_id=staff.department_id)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return EncounterSummarySerializer
        return EncounterSerializer



class ConsultationQueueView(generics.ListAPIView):
    serializer_class = ConsultationQueueSerializer
    permission_classes = [IsAnyStaff]
    queryset = (
        Encounter.objects
        .filter(
            active=True,
            status=Encounter.Status.VITALS_DONE,
        )
        .select_related(
            'visit',
            'visit__medical_record',
            'visit__medical_record__patient',
            'department',
            'doctor',
            'doctor__staff',
            'doctor__staff__user',
        ).prefetch_related(
            'vital_signs',
        )
    )
    filter_backends = [filters.SearchFilter, filters.OrderingFilter,]
    search_fields = [
        'visit__visit_number',
        'visit__medical_record__patient__full_name',
        'visit__medical_record__patient__phone',
        'department__name',
    ]
    ordering_fields = ['visit__arrived_at', 'created_at',]
    ordering = ['visit__arrived_at',]

    def get_queryset(self):
        queryset = super().get_queryset()
        staff = getattr(self.request.user, 'staff_profile', None)

        if not staff or staff.role != staff.Role.DOCTOR:
            return queryset

        if not staff.department_id:
            return queryset.none()

        return queryset.filter(department_id=staff.department_id)
