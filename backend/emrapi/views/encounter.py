from rest_framework import viewsets,filters

from emrapi.models  import Encounter
from emrapi.permission import IsAnyStaff
from emrapi.serializers import EncounterSerializer,EncounterSummarySerializer

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
    )
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

    def get_serializer_class(self):
        if self.action == 'list':
            return EncounterSummarySerializer
        return EncounterSerializer