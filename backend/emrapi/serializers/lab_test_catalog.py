from emrapi.models import LabTestCatalog

from .base import ModelCleanSerializer


class LabTestCatalogSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = LabTestCatalog
        fields = [
            'id',
            'code',
            'name',
            'category',
            'specimen_type',
            'description',
            'active',
        ]
        read_only_fields = fields


class LabTestCatalogSerializer(ModelCleanSerializer):
    class Meta:
        model = LabTestCatalog
        fields = [
            'id',
            'code',
            'name',
            'category',
            'specimen_type',
            'description',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
