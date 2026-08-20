from emrapi.models import Medication

from .base import ModelCleanSerializer


class MedicationSummarySerializer(ModelCleanSerializer):
    class Meta:
        model = Medication
        fields = [
            'id',
            'code',
            'name',
            'active_ingredient',
            'strength',
            'dosage_form',
            'unit',
            'route',
            'active',
        ]
        read_only_fields = fields


class MedicationSerializer(ModelCleanSerializer):
    class Meta:
        model = Medication
        fields = [
            'id',
            'code',
            'name',
            'active_ingredient',
            'strength',
            'dosage_form',
            'unit',
            'route',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
