from emrapi.models import Department

from .base import ModelCleanSerializer


class DepartmentSerializer(ModelCleanSerializer):
    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'description',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DepartmentSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']
        read_only_fields = fields
