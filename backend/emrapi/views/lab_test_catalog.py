from rest_framework import filters, viewsets

from emrapi.models import LabTestCatalog
from emrapi.permission import IsEMRAdmin
from emrapi.serializers import (
    LabTestCatalogSerializer,
    LabTestCatalogSummarySerializer,
)


class LabTestCatalogViewSet(viewsets.ModelViewSet):
    queryset = LabTestCatalog.objects.all()
    permission_classes = [IsEMRAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'category', 'specimen_type']
    ordering_fields = ['code', 'name', 'category', 'specimen_type', 'created_at']
    ordering = ['name']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'list':
            return LabTestCatalogSummarySerializer
        return LabTestCatalogSerializer
