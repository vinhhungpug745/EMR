from pathlib import Path

from django.db import transaction
from django.http import FileResponse
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError

from emrapi.audit import AuditTrailMixin
from emrapi.lab_access import get_lab_categories_for_staff
from emrapi.models import Encounter, LabTest, MedicalAttachment, StaffProfile
from emrapi.permission import IsDoctorOrLabTechnicianOrAdmin
from emrapi.serializers import MedicalAttachmentSerializer


class MedicalAttachmentViewSet(AuditTrailMixin, viewsets.ModelViewSet):
    serializer_class = MedicalAttachmentSerializer
    permission_classes = [IsDoctorOrLabTechnicianOrAdmin]
    queryset = (
        MedicalAttachment.objects
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
            'lab_test',
            'lab_test__test_catalog',
            'uploaded_by',
            'uploaded_by__user',
        )
    )
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'title',
        'description',
        'encounter__visit__visit_number',
        'encounter__visit__medical_record__patient__full_name',
    ]
    ordering_fields = ['title', 'created_at', 'updated_at']
    ordering = ['-created_at']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        encounter_id = self.request.query_params.get('encounter')
        lab_test_id = self.request.query_params.get('lab_test')
        if encounter_id:
            queryset = queryset.filter(encounter_id=encounter_id)
        if lab_test_id:
            queryset = queryset.filter(lab_test_id=lab_test_id)

        staff = getattr(self.request.user, 'staff_profile', None)
        if not staff:
            return queryset.none()
        if staff.role == StaffProfile.Role.LAB_TECHNICIAN:
            categories = get_lab_categories_for_staff(staff)
            if not categories:
                return queryset.none()
            return queryset.filter(
                lab_test__test_catalog__category__in=categories,
            )
        return queryset

    def perform_create(self, serializer):
        staff = self.request.staff_profile
        encounter = serializer.validated_data['encounter']
        lab_test = serializer.validated_data.get('lab_test')

        if staff.role == StaffProfile.Role.DOCTOR:
            doctor = getattr(staff, 'doctor_profile', None)
            if not doctor or encounter.doctor_id != doctor.id:
                raise PermissionDenied('Bác sĩ chỉ được đính kèm tệp vào lượt khám của mình.')
            if lab_test:
                raise PermissionDenied(
                    'Tệp kết quả xét nghiệm phải do nhân viên xét nghiệm tải lên.'
                )
            if encounter.status in (Encounter.Status.COMPLETED, Encounter.Status.CANCELLED):
                raise ValidationError({
                    'encounter': 'Không thể thêm tệp vào lượt khám đã hoàn tất hoặc đã hủy.'
                })

        elif staff.role == StaffProfile.Role.LAB_TECHNICIAN:
            if not lab_test:
                raise ValidationError({
                    'lab_test': 'Nhân viên xét nghiệm phải chọn một chỉ định xét nghiệm.'
                })
            categories = get_lab_categories_for_staff(staff)
            if lab_test.test_catalog.category not in categories:
                raise PermissionDenied(
                    'Bạn chỉ được tải tệp cho xét nghiệm thuộc đơn vị của mình.'
                )
            if lab_test.status != LabTest.Status.PROCESSING:
                raise ValidationError({
                    'lab_test': 'Chỉ được tải tệp khi xét nghiệm đang được xử lý.'
                })

        serializer.save()

    def perform_update(self, serializer):
        self._check_modify_permission(serializer.instance)
        old_file = serializer.instance.file
        old_name = old_file.name if old_file else None
        old_storage = old_file.storage if old_file else None
        instance = serializer.save()
        if old_name and instance.file.name != old_name:
            transaction.on_commit(lambda: old_storage.delete(old_name))

    def perform_destroy(self, instance):
        self._check_modify_permission(instance)
        file_name = instance.file.name if instance.file else None
        storage = instance.file.storage if instance.file else None
        instance.delete()
        if file_name:
            transaction.on_commit(lambda: storage.delete(file_name))

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        attachment = self.get_object()
        if not attachment.file:
            raise ValidationError({'file': 'Tệp đính kèm không còn tồn tại.'})
        return FileResponse(
            attachment.file.open('rb'),
            as_attachment=True,
            filename=Path(attachment.file.name).name,
        )

    def _check_modify_permission(self, attachment):
        staff = self.request.staff_profile
        if staff.role == StaffProfile.Role.ADMIN:
            return
        if attachment.uploaded_by_id != staff.id:
            raise PermissionDenied('Bạn chỉ được sửa hoặc xóa tệp do mình tải lên.')

        if staff.role == StaffProfile.Role.DOCTOR:
            doctor = getattr(staff, 'doctor_profile', None)
            if attachment.lab_test_id or attachment.encounter.doctor_id != getattr(doctor, 'id', None):
                raise PermissionDenied('Bác sĩ chỉ được quản lý tài liệu chung của lượt khám mình phụ trách.')
            if attachment.encounter.status in (
                Encounter.Status.COMPLETED,
                Encounter.Status.CANCELLED,
            ):
                raise PermissionDenied('Lượt khám đã kết thúc, không thể sửa hoặc xóa tệp.')
            return

        if staff.role == StaffProfile.Role.LAB_TECHNICIAN:
            lab_test = attachment.lab_test
            categories = get_lab_categories_for_staff(staff)
            if not lab_test or lab_test.test_catalog.category not in categories:
                raise PermissionDenied('Bạn không có quyền quản lý tệp này.')
            if lab_test.status != LabTest.Status.PROCESSING:
                raise PermissionDenied('Xét nghiệm đã kết thúc, không thể sửa hoặc xóa tệp.')
            return

        raise PermissionDenied('Bạn không có quyền quản lý tệp này.')
