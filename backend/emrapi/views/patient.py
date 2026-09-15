from rest_framework import viewsets,filters

from emrapi.models import Patient
from emrapi.audit import AuditTrailMixin
from emrapi.permission import IsReceptionistOrAdmin
from emrapi.serializers import PatientSerializer,PatientSummarySerializer

class PatientViewSet(AuditTrailMixin, viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    permission_classes = [IsReceptionistOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'phone','citizen_id','health_insurance_code']
    ordering_fields = ['full_name']
    ordering = ['full_name']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientSummarySerializer
        return PatientSerializer
