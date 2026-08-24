from rest_framework import filters, viewsets

from emrapi.models import Department
from emrapi.permission import IsAnyStaff
from emrapi.serializers import DepartmentSerializer, DepartmentSummarySerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    permission_classes = [IsAnyStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentSummarySerializer
        return DepartmentSerializer
