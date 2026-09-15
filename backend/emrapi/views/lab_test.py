from django.db import transaction
from rest_framework import filters, viewsets, generics
from rest_framework.exceptions import PermissionDenied, ValidationError

from emrapi.models import Encounter, LabTest, StaffProfile
from emrapi.lab_access import get_lab_categories_for_staff
from emrapi.permission import (
    IsDoctor,
    IsDoctorOrLabTechnicianOrAdmin,
    IsLabTechnicianOrAdmin,
)
from emrapi.serializers import LabTestSerializer


def validate_lab_test_transition(instance, next_status):
    if next_status == instance.status:
        return

    allowed_transitions = {
        LabTest.Status.ORDERED: [
            LabTest.Status.PROCESSING,
            LabTest.Status.CANCELLED,
        ],
        LabTest.Status.PROCESSING: [
            LabTest.Status.COMPLETED,
            LabTest.Status.CANCELLED,
        ],
        LabTest.Status.COMPLETED: [],
        LabTest.Status.CANCELLED: [],
    }

    if next_status not in allowed_transitions.get(instance.status, []):
        raise ValidationError({
            'status': 'Trạng thái xét nghiệm không hợp lệ.'
        })


from emrapi.audit import AuditTrailMixin


class LabTestViewSet(AuditTrailMixin, viewsets.ModelViewSet):
    serializer_class = LabTestSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'encounter__visit__visit_number',
        'encounter__visit__medical_record__patient__full_name',
        'encounter__visit__medical_record__patient__phone',
        'test_catalog__code',
        'test_catalog__name',
        'test_catalog__category',
        'result',
    ]
    ordering_fields = ['ordered_at', 'performed_at', 'status', 'created_at']
    ordering = ['-ordered_at']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        permission_classes = (
            [IsDoctor]
            if self.action == 'create'
            else [IsDoctorOrLabTechnicianOrAdmin]
        )
        return [permission() for permission in permission_classes]

    queryset = (
        LabTest.objects
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
            'test_catalog',
            'ordered_by',
            'ordered_by__staff',
            'ordered_by__staff__user',
            'performed_by',
            'performed_by__staff',
            'performed_by__staff__user',
        )
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        staff = getattr(self.request.user, 'staff_profile', None)

        encounter_id = self.request.query_params.get('encounter')
        status = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        ordered_by = self.request.query_params.get('ordered_by')
        performed_by = self.request.query_params.get('performed_by')

        if encounter_id:
            queryset = queryset.filter(encounter_id=encounter_id)
        if status:
            queryset = queryset.filter(status=status)
        if category:
            queryset = queryset.filter(test_catalog__category=category)
        if ordered_by:
            queryset = queryset.filter(ordered_by_id=ordered_by)
        if performed_by:
            queryset = queryset.filter(performed_by_id=performed_by)

        if not staff:
            return queryset.none()

        if staff.role == StaffProfile.Role.ADMIN:
            return queryset

        if staff.role == StaffProfile.Role.DOCTOR:
            doctor_profile = getattr(staff, 'doctor_profile', None)
            if not doctor_profile:
                return queryset.none()
            return queryset.filter(encounter__doctor=doctor_profile)

        if staff.role == StaffProfile.Role.LAB_TECHNICIAN:
            categories = get_lab_categories_for_staff(staff)
            if not categories:
                return queryset.none()
            return queryset.filter(test_catalog__category__in=categories)

        return queryset.none()

    @transaction.atomic
    def perform_create(self, serializer):
        staff = getattr(self.request.user, 'staff_profile', None)
        doctor_profile = getattr(staff, 'doctor_profile', None)

        if staff.role != StaffProfile.Role.DOCTOR or not doctor_profile:
            raise PermissionDenied('Chỉ bác sĩ mới được chỉ định xét nghiệm.')

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
                'Bác sĩ chỉ được chỉ định xét nghiệm cho lượt khám của mình.'
            )

        if encounter.status != Encounter.Status.IN_PROGRESS:
            raise ValidationError({
                'encounter': 'Chỉ được chỉ định xét nghiệm khi lượt khám đang diễn ra.'
            })

        test_catalog = serializer.validated_data['test_catalog']
        duplicated = LabTest.objects.filter(
            encounter=encounter,
            test_catalog=test_catalog,
            active=True,
        ).exclude(status=LabTest.Status.CANCELLED).exists()

        if duplicated:
            raise ValidationError({
                'test_catalog': 'Xét nghiệm này đã được chỉ định trong lượt khám.'
            })

        serializer.save()

    @transaction.atomic
    def perform_update(self, serializer):
        staff = getattr(self.request.user, 'staff_profile', None)
        instance = serializer.instance

        if not instance.active:
            raise ValidationError('Chỉ định xét nghiệm này đã ngừng hoạt động.')

        blocked_fields = {'encounter', 'test_catalog', 'ordered_by', 'performed_by'}
        if blocked_fields.intersection(serializer.validated_data):
            raise ValidationError(
                'Không được thay đổi thông tin gốc của chỉ định xét nghiệm.'
            )

        next_status = serializer.validated_data.get('status', instance.status)
        validate_lab_test_transition(instance, next_status)

        if staff.role == StaffProfile.Role.ADMIN:
            serializer.save()
            return

        if staff.role == StaffProfile.Role.DOCTOR:
            doctor_profile = getattr(staff, 'doctor_profile', None)
            if instance.ordered_by_id != getattr(doctor_profile, 'id', None):
                raise PermissionDenied(
                    'Bác sĩ chỉ được cập nhật chỉ định xét nghiệm của mình.'
                )
            if set(serializer.validated_data.keys()) != {'status'}:
                raise PermissionDenied(
                    'Bác sĩ chỉ được hủy chỉ định xét nghiệm.'
                )
            if next_status != LabTest.Status.CANCELLED:
                raise PermissionDenied(
                    'Bác sĩ chỉ được hủy chỉ định xét nghiệm.'
                )
            if instance.status != LabTest.Status.ORDERED:
                raise ValidationError({
                    'status': 'Chỉ được hủy xét nghiệm đang chờ tiếp nhận.'
                })
            serializer.save()
            return

        if staff.role == StaffProfile.Role.LAB_TECHNICIAN:
            categories = get_lab_categories_for_staff(staff)
            if instance.test_catalog.category not in categories:
                raise PermissionDenied(
                    'Kỹ thuật viên chỉ được xử lý xét nghiệm thuộc đơn vị của mình.'
                )
            serializer.save()
            return

        raise PermissionDenied('Bạn không có quyền cập nhật chỉ định xét nghiệm.')

class LabTechnicianQueueView(AuditTrailMixin, generics.ListAPIView):
    serializer_class = LabTestSerializer
    permission_classes = [IsLabTechnicianOrAdmin]
    filter_backends = [filters.SearchFilter,filters.OrderingFilter,]
    search_fields = [
        'test_catalog__code',
        'test_catalog__name',
        'test_catalog__category',
        'encounter__visit__visit_number',
        'encounter__visit__medical_record__patient__full_name',
    ]
    ordering_fields = ['ordered_at','created_at',]
    ordering = ['ordered_at']

    def get_queryset(self):
        staff = getattr(self.request.user, 'staff_profile', None)
        if not staff:
            return LabTest.objects.none()

        queryset = (
            LabTest.objects
            .filter(
                active=True,
                status=LabTest.Status.ORDERED,
            )
            .select_related(
                'encounter',
                'encounter__visit',
                'encounter__visit__medical_record',
                'encounter__visit__medical_record__patient',
                'test_catalog',
                'ordered_by',
                'ordered_by__staff',
                'ordered_by__staff__user',
            )
        )

        if staff.role == StaffProfile.Role.ADMIN:
            return queryset

        technician = getattr(staff, 'lab_technician_profile', None)
        if technician is None:
            return LabTest.objects.none()

        categories = get_lab_categories_for_staff(staff)
        if not categories:
            return LabTest.objects.none()

        return queryset.filter(test_catalog__category__in=categories)
