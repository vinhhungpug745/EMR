from datetime import datetime, time, timedelta

from django.utils import timezone
from rest_framework import filters, serializers, viewsets

from emrapi.models import AuditLog
from emrapi.permission import IsEMRAdmin
from emrapi.serializers.audit_log import AuditLogSerializer


class AuditLogFiltersSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=AuditLog.Action.choices, required=False)
    resource_type = serializers.CharField(max_length=120, required=False)
    actor = serializers.IntegerField(min_value=1, required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start, end = attrs.get('start_date'), attrs.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError({'end_date': 'Ngày kết thúc phải từ ngày bắt đầu trở đi.'})
        if end and end.year == 9999:
            raise serializers.ValidationError({'end_date': 'Ngày kết thúc nằm ngoài phạm vi hỗ trợ.'})
        return attrs


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    # Intentionally not audited: browsing the trail must not generate more events.
    queryset = AuditLog.objects.select_related('actor').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsEMRAdmin]
    http_method_names = ['get', 'head', 'options']
    filter_backends = [filters.SearchFilter]
    search_fields = ['actor__username', 'actor__first_name', 'actor__last_name',
                     'resource_repr', 'resource_id', 'description', 'ip_address']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset.none()
        validator = AuditLogFiltersSerializer(data=self.request.query_params)
        validator.is_valid(raise_exception=True)
        values = validator.validated_data
        queryset = super().get_queryset()
        for key in ('action', 'resource_type', 'actor'):
            if key in values:
                queryset = queryset.filter(**{key: values[key]})
        if 'start_date' in values:
            start = timezone.make_aware(datetime.combine(values['start_date'], time.min))
            queryset = queryset.filter(created_at__gte=start)
        if 'end_date' in values:
            end = timezone.make_aware(datetime.combine(values['end_date'] + timedelta(days=1), time.min))
            queryset = queryset.filter(created_at__lt=end)
        return queryset.order_by('-created_at', '-id')
