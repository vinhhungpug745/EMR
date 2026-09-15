from pathlib import Path

from django.core.validators import FileExtensionValidator
from rest_framework import serializers

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
    file_name = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    lab_test_detail = serializers.SerializerMethodField()

    class Meta:
        model = MedicalAttachment
        fields = [
            'id',
            'encounter',
            'encounter_detail',
            'lab_test',
            'lab_test_detail',
            'uploaded_by',
            'uploaded_by_detail',
            'title',
            'file',
            'file_name',
            'file_size',
            'description',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'encounter_detail',
            'lab_test_detail',
            'uploaded_by',
            'uploaded_by_detail',
            'file_name',
            'file_size',
            'active',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'file': {'write_only': True},
        }

    def validate_file(self, value):
        FileExtensionValidator(
            allowed_extensions=['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'],
            message='Chỉ chấp nhận tệp PDF, PNG, JPG, DOC hoặc DOCX.',
        )(value)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Kích thước tệp không được vượt quá 10 MB.')
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        encounter = attrs.get(
            'encounter',
            self.instance.encounter if self.instance else None,
        )
        lab_test = attrs.get(
            'lab_test',
            self.instance.lab_test if self.instance else None,
        )
        if self.instance:
            if 'encounter' in attrs and encounter.pk != self.instance.encounter_id:
                raise serializers.ValidationError({
                    'encounter': 'Không được chuyển tệp sang lượt khám khác.'
                })
            if 'lab_test' in attrs and getattr(lab_test, 'pk', None) != self.instance.lab_test_id:
                raise serializers.ValidationError({
                    'lab_test': 'Không được chuyển tệp sang xét nghiệm khác.'
                })
        if lab_test and encounter and lab_test.encounter_id != encounter.pk:
            raise serializers.ValidationError({
                'lab_test': 'Xét nghiệm và tệp đính kèm phải thuộc cùng một lượt khám.'
            })
        return attrs

    def get_lab_test_detail(self, obj):
        if not obj.lab_test_id:
            return None
        return {
            'id': obj.lab_test_id,
            'name': obj.lab_test.test_catalog.name,
            'code': obj.lab_test.test_catalog.code,
            'status': obj.lab_test.status,
            'status_display': obj.lab_test.get_status_display(),
        }

    def get_file_name(self, obj):
        return Path(obj.file.name).name if obj.file else None

    def get_file_size(self, obj):
        if not obj.file:
            return None
        try:
            return obj.file.size
        except OSError:
            return None

    def create(self, validated_data):
        validated_data['uploaded_by'] = get_request_staff(self)
        return super().create(validated_data)
