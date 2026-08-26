from rest_framework import filters, viewsets

from emrapi.models import LabTestCatalog
from emrapi.permission import IsAnyStaff, IsEMRAdmin
from emrapi.serializers import (
    LabTestCatalogSerializer,
    LabTestCatalogSummarySerializer,
)


class LabTestCatalogViewSet(viewsets.ModelViewSet):
    queryset = LabTestCatalog.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'category', 'specimen_type']
    ordering_fields = ['code', 'name', 'category', 'specimen_type', 'created_at']
    ordering = ['name']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        permission_classes = [IsAnyStaff] if self.action in ['list', 'retrieve'] else [IsEMRAdmin]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == 'list':
            return LabTestCatalogSummarySerializer
        return LabTestCatalogSerializer
