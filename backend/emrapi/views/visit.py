from rest_framework import viewsets,filters

from emrapi.models import Visit
from emrapi.permission import IsReceptionistOrAdmin
from emrapi.serializers import VisitSerializer,VisitSummarySerializer


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.select_related('medical_record', 'medical_record__patient','created_by')
    permission_classes = [IsReceptionistOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # filterset_fields = ['status', 'visit_type', 'created_by']

    search_fields = [
        'visit_number',
        'medical_record__patient__full_name',
        'medical_record__patient__phone',
        'reason',
    ]

    ordering_fields = ['arrived_at', 'status', 'visit_number','created_at']
    ordering = ['-arrived_at']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return VisitSummarySerializer
        return VisitSerializer

