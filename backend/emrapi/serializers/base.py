from copy import copy

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


def get_request_staff(serializer):
    request = serializer.context.get('request')
    user = getattr(request, 'user', None)

    if not user or not user.is_authenticated:
        raise serializers.ValidationError(
            {'detail': 'Khong xac dinh duoc nhan vien dang thao tac.'}
        )

    staff = getattr(user, 'staff_profile', None)
    if staff is None or not staff.active:
        raise serializers.ValidationError(
            {'detail': 'Ho so nhan vien khong ton tai hoac da ngung hoat dong.'}
        )
    return staff


class ModelCleanSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = copy(self.instance) if self.instance else self.Meta.model()
        model_fields = {field.name for field in instance._meta.fields}

        for field_name, value in attrs.items():
            if field_name in model_fields:
                setattr(instance, field_name, value)

        try:
            instance.clean()
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None)
            raise serializers.ValidationError(
                detail or {'non_field_errors': exc.messages}
            ) from exc

        return attrs
