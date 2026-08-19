from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from emrapi.models import StaffProfile


class UserStaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = [
            'id',
            'department',
            'role',
            'employee_code',
            'phone',
            'gender',
            'active',
        ]
        extra_kwargs = {
            'employee_code': {'validators': []},
        }
        read_only_fields = ['id']


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    full_name = serializers.SerializerMethodField(read_only=True)
    staff_profile = UserStaffProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'password',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'is_active',
            'staff_profile',
            'date_joined',
        ]
        read_only_fields = ['id', 'full_name', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def validate_password(self, value):
        try:
            validate_password(value, self.instance)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        staff_data = attrs.get('staff_profile')

        if self.instance is None:
            errors = {}
            if not attrs.get('password'):
                errors['password'] = 'Mat khau la bat buoc khi tao tai khoan.'
            if not staff_data:
                errors['staff_profile'] = 'Ho so nhan vien la bat buoc.'
            if errors:
                raise serializers.ValidationError(errors)

        employee_code = staff_data.get('employee_code') if staff_data else None
        if employee_code:
            duplicate_staff = StaffProfile.objects.filter(
                employee_code=employee_code
            )
            if self.instance is not None:
                duplicate_staff = duplicate_staff.exclude(user=self.instance)
            if duplicate_staff.exists():
                raise serializers.ValidationError({
                    'staff_profile': {
                        'employee_code': 'Ma nhan vien da ton tai.'
                    }
                })

        current_staff = getattr(self.instance, 'staff_profile', None)
        if (
            current_staff
            and staff_data
            and 'role' in staff_data
            and staff_data['role'] != current_staff.role
        ):
            raise serializers.ValidationError({
                'staff_profile': {
                    'role': (
                        'Khong doi vai tro tai day vi co the lam sai lech '
                        'ho so nghe nghiep hien co.'
                    )
                }
            })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        staff_data = validated_data.pop('staff_profile')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        StaffProfile.objects.create(user=user, **staff_data)
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        staff_data = validated_data.pop('staff_profile', None)
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)

        if password:
            instance.set_password(password)
            instance.save(update_fields=['password'])

        if staff_data is not None:
            staff, created = StaffProfile.objects.get_or_create(
                user=instance,
                defaults=staff_data,
            )
            if not created:
                for field_name, value in staff_data.items():
                    setattr(staff, field_name, value)
                staff.full_clean()
                staff.save(update_fields=[*staff_data.keys(), 'updated_at'])
        return instance
