from emrapi.models import MedicalAttachment

from .base import ModelCleanSerializer, get_request_staff
from .encounter import EncounterSummarySerializer
from .staff_profile import StaffProfileSummarySerializer


class MedicalAttachmentSerializer(ModelCleanSerializer):
    encounter_detail = EncounterSummarySerializer(source='encounter', read_only=True)
    uploaded_by_detail = StaffProfileSummarySerializer(
        source='uploaded_by',
        read_only=True,
    )

    class Meta:
        model = MedicalAttachment
        fields = [
            'id',
            'encounter',
            'encounter_detail',
            'uploaded_by',
            'uploaded_by_detail',
            'title',
            'file',
            'description',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'encounter_detail',
            'uploaded_by',
            'uploaded_by_detail',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        validated_data['uploaded_by'] = get_request_staff(self)
        return super().create(validated_data)
