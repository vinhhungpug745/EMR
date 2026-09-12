from django.db import transaction
from rest_framework import filters, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from emrapi.models import Encounter, Prescription, StaffProfile
from emrapi.permission import IsDoctor, IsDoctorOrAdmin
from emrapi.serializers import PrescriptionSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'encounter__visit__visit_number',
        'encounter__visit__medical_record__patient__full_name',
        'encounter__visit__medical_record__patient__phone',
        'items__medication__name',
        'items__medication__active_ingredient',
        'note',
    ]
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        permission_classes = [IsDoctor] if self.action == 'create' else [IsDoctorOrAdmin]
        return [permission() for permission in permission_classes]

    queryset = (
        Prescription.objects
        .filter(active=True)
        .select_related(
            'encounter',
            'encounter__visit',
            'encounter__visit__medical_record',
            'encounter__visit__medical_record__patient',
            'encounter__department',
            'encounter__doctor',
            'encounter__doctor__staff',
            'encounter__doctor__staff__user',
            'prescribed_by',
            'prescribed_by__staff',
            'prescribed_by__staff__user',
        )
        .prefetch_related(
            'items',
            'items__medication',
        )
        .distinct()
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        staff = getattr(self.request.user, 'staff_profile', None)

        encounter_id = self.request.query_params.get('encounter')
        status = self.request.query_params.get('status')

        if encounter_id:
            queryset = queryset.filter(encounter_id=encounter_id)
        if status:
            queryset = queryset.filter(status=status)

        if not staff:
            return queryset.none()

        if staff.role == StaffProfile.Role.ADMIN:
            return queryset

        if staff.role == StaffProfile.Role.DOCTOR:
            doctor_profile = getattr(staff, 'doctor_profile', None)
            if not doctor_profile:
                return queryset.none()
            return queryset.filter(encounter__doctor=doctor_profile)

        return queryset.none()

    @transaction.atomic
    def perform_create(self, serializer):
        staff = self.request.staff_profile
        doctor_profile = getattr(staff, 'doctor_profile', None)

        if staff.role != StaffProfile.Role.DOCTOR or not doctor_profile:
            raise PermissionDenied('Chỉ bác sĩ mới được lập đơn thuốc.')

        encounter = (
            Encounter.objects
            .select_for_update()
            .filter(pk=serializer.validated_data['encounter'].pk)
            .first()
        )

        if not encounter or not encounter.active:
            raise ValidationError({
                'encounter': 'Lượt khám không tồn tại hoặc đã ngừng hoạt động.'
            })

        if encounter.doctor_id != doctor_profile.id:
            raise PermissionDenied(
                'Bác sĩ chỉ được kê đơn cho lượt khám của mình.'
            )

        if encounter.status != Encounter.Status.IN_PROGRESS:
            raise ValidationError({
                'encounter': 'Chỉ được kê đơn khi lượt khám đang diễn ra.'
            })

        serializer.save()

    @transaction.atomic
    def perform_update(self, serializer):
        staff = self.request.staff_profile
        instance = serializer.instance
        doctor_profile = getattr(staff, 'doctor_profile', None)

        if not instance.active:
            raise ValidationError('Đơn thuốc này đã ngừng hoạt động.')

        if staff.role == StaffProfile.Role.ADMIN:
            serializer.save()
            return

        if staff.role != StaffProfile.Role.DOCTOR or not doctor_profile:
            raise PermissionDenied('Chỉ bác sĩ mới được cập nhật đơn thuốc.')

        if instance.prescribed_by_id != doctor_profile.id:
            raise PermissionDenied(
                'Bác sĩ chỉ được cập nhật đơn thuốc của mình.'
            )

        if instance.status == Prescription.Status.CANCELLED:
            raise ValidationError({
                'status': 'Đơn thuốc đã hủy không thể cập nhật.'
            })

        serializer.save()
