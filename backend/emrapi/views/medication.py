from rest_framework import filters, viewsets

from emrapi.models import Medication
from emrapi.permission import IsEMRAdmin
from emrapi.serializers import MedicationSerializer, MedicationSummarySerializer


class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    permission_classes = [IsEMRAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'active_ingredient', 'strength']
    ordering_fields = ['code', 'name', 'active_ingredient', 'strength', 'created_at']
    ordering = ['name', 'strength']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'list':
            return MedicationSummarySerializer
        return MedicationSerializer
