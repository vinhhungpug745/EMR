from django.db import transaction
from rest_framework import serializers

from emrapi.models import Medication, Prescription, PrescriptionItem

from .base import ModelCleanSerializer, get_request_staff
from .doctor_profile import DoctorProfileSummarySerializer
from .encounter import EncounterSummarySerializer
from .medication import MedicationSummarySerializer


class PrescriptionItemSerializer(ModelCleanSerializer):
    medication = serializers.PrimaryKeyRelatedField(
        queryset=Medication.objects.all(),
        required=True,
        allow_null=False,
    )
    medication_detail = MedicationSummarySerializer(
        source='medication',
        read_only=True,
    )

    class Meta:
        model = PrescriptionItem
        fields = [
            'id',
            'prescription',
            'medication',
            'medication_detail',
            'dosage',
            'frequency',
            'duration',
            'quantity',
            'instruction',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'medication_detail',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'prescription': {'required': False},
        }


class NestedPrescriptionItemSerializer(PrescriptionItemSerializer):
    class Meta(PrescriptionItemSerializer.Meta):
        fields = [
            field
            for field in PrescriptionItemSerializer.Meta.fields
            if field != 'prescription'
        ]
        validators = []


class PrescriptionSerializer(ModelCleanSerializer):
    encounter_detail = EncounterSummarySerializer(source='encounter', read_only=True)
    prescribed_by_detail = DoctorProfileSummarySerializer(
        source='prescribed_by',
        read_only=True,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = NestedPrescriptionItemSerializer(many=True, required=False)

    class Meta:
        model = Prescription
        fields = [
            'id',
            'encounter',
            'encounter_detail',
            'prescribed_by',
            'prescribed_by_detail',
            'status',
            'status_display',
            'note',
            'items',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'encounter_detail',
            'prescribed_by',
            'prescribed_by_detail',
            'status_display',
            'created_at',
            'updated_at',
        ]

    def validate_items(self, items):
        medication_ids = [item['medication'].pk for item in items]
        if len(medication_ids) != len(set(medication_ids)):
            raise serializers.ValidationError(
                'Mot thuoc khong duoc lap lai trong cung mot don.'
            )
        return items

    def validate(self, attrs):
        attrs = super().validate(attrs)
        status = attrs.get('status', getattr(self.instance, 'status', None))
        items = attrs.get('items')
        existing_items = self.instance.items.exists() if self.instance else False

        if status == Prescription.Status.ISSUED:
            has_items = bool(items) if items is not None else existing_items
            if not has_items:
                raise serializers.ValidationError(
                    {'items': 'Don thuoc da ke phai co it nhat mot thuoc.'}
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        staff = get_request_staff(self)
        doctor_profile = getattr(staff, 'doctor_profile', None)
        if doctor_profile is None:
            raise serializers.ValidationError({
                'prescribed_by': 'Chi bac si moi duoc lap don thuoc.'
            })
        validated_data['prescribed_by'] = doctor_profile
        prescription = Prescription.objects.create(**validated_data)
        self._replace_items(prescription, items_data)
        return prescription

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            self._replace_items(instance, items_data)
        return instance

    @staticmethod
    def _replace_items(prescription, items_data):
        PrescriptionItem.objects.bulk_create(
            [
                PrescriptionItem(prescription=prescription, **item_data)
                for item_data in items_data
            ]
        )
