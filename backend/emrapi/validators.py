from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_not_future_date(value):
    if value and value > timezone.localdate():
        raise ValidationError('Ngày không được nằm trong tương lai.')
