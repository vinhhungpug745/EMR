from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, filters, generics
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from emrapi.models  import Department, Encounter, Prescription, StaffProfile, Visit
from emrapi.permission import IsDoctorOrAdmin, IsReceptionistOrAdmin
from emrapi.serializers import EncounterSerializer, EncounterSummarySerializer, ConsultationQueueSerializer

from emrapi.audit import AuditTrailMixin


class EncounterViewSet(AuditTrailMixin, viewsets.ModelViewSet):
    queryset = Encounter.objects.select_related(
        'visit',
        'visit__medical_record',
        'visit__medical_record__patient',
        'department',
        'doctor',
        'doctor__staff',
        'doctor__staff__user',
        'created_by',
    ).prefetch_related('vital_signs')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'chief_complaint',
        'visit__visit_number',
        'visit__medical_record__patient__full_name',
        'visit__medical_record__patient__phone',
        'department__name',
    ]
    ordering_fields = ['started_at', 'status', 'created_at']
    ordering = ['-started_at']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        permission_classes = (
            [IsReceptionistOrAdmin]
            if self.action == 'create'
            else [IsDoctorOrAdmin]
        )
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        staff = getattr(self.request.user, 'staff_profile', None)
        status = self.request.query_params.get('status')

        if status:
            queryset = queryset.filter(status=status)

        if staff and staff.role == staff.Role.DOCTOR:
            if not staff.department_id:
                return queryset.none()

            doctor_profile = getattr(staff, 'doctor_profile', None)
            if not doctor_profile:
                return queryset.none()

            queryset = queryset.filter(
                Q(doctor_id=doctor_profile.id) | Q(doctor__isnull=True),
                department_id=staff.department_id,
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return EncounterSummarySerializer
        return EncounterSerializer

    def perform_update(self, serializer):
        staff = self.request.staff_profile
        if staff.role == StaffProfile.Role.DOCTOR:
            doctor_profile = getattr(staff, 'doctor_profile', None)
            instance = serializer.instance

            if not doctor_profile or instance.doctor_id not in (None, doctor_profile.id):
                raise PermissionDenied('Bác sĩ chỉ được cập nhật lượt khám của mình.')

            if instance.doctor_id is None:
                next_status = serializer.validated_data.get('status', instance.status)
                if next_status != Encounter.Status.IN_PROGRESS:
                    raise PermissionDenied(
                        'Bác sĩ phải tiếp nhận lượt khám trước khi cập nhật.'
                    )

        serializer.save()

    @action(detail=True, methods=['post'], url_path='transfer-specialty')
    @transaction.atomic
    def transfer_specialty(self, request, pk=None):
        staff = getattr(request, 'staff_profile', None)
        doctor_profile = getattr(staff, 'doctor_profile', None)

        if staff.role != StaffProfile.Role.DOCTOR or not doctor_profile:
            raise PermissionDenied('Chi bac si moi duoc chuyen kham chuyen khoa.')

        encounter = (
            Encounter.objects
            .select_for_update()
            .select_related('visit', 'department', 'doctor')
            .filter(pk=pk, active=True)
            .first()
        )

        if encounter is None:
            raise ValidationError({
                'encounter': 'Luot kham khong ton tai hoac da ngung hoat dong.'
            })

        if encounter.doctor_id != doctor_profile.id:
            raise PermissionDenied('Bac si chi duoc chuyen luot kham cua minh.')

        if encounter.status != Encounter.Status.IN_PROGRESS:
            raise ValidationError({
                'status': 'Chi duoc chuyen khoa khi luot kham dang dien ra.'
            })

        if encounter.visit.status in [Visit.Status.COMPLETED, Visit.Status.CANCELLED]:
            raise ValidationError({
                'visit': 'Lan den kham da hoan thanh hoac da huy.'
            })

        if not (encounter.diagnosis or '').strip():
            raise ValidationError({
                'diagnosis': 'Can ghi nhan nhan dinh ban dau truoc khi chuyen khoa.'
            })

        department_id = request.data.get('department')
        reason = (request.data.get('reason') or '').strip()

        if not reason:
            raise ValidationError({
                'reason': 'Vui long nhap ly do chuyen khoa.'
            })

        department = Department.objects.filter(pk=department_id, active=True).first()
        if department is None:
            raise ValidationError({
                'department': 'Khoa tiep nhan khong hoat dong hoac khong ton tai.'
            })

        if encounter.department_id == department.id:
            raise ValidationError({
                'department': 'Khoa tiep nhan khong duoc trung voi khoa hien tai.'
            })

        has_issued_prescription = encounter.prescriptions.filter(
            active=True,
            status=Prescription.Status.ISSUED,
        ).exists()

        if has_issued_prescription:
            raise ValidationError({
                'prescriptions': 'Can huy don thuoc da phat hanh truoc khi chuyen khoa.'
            })

        transfer_note = f'Chuyen kham chuyen khoa {department.name}: {reason}'
        treatment_plan = (encounter.treatment_plan or '').strip()
        encounter.treatment_plan = (
            f'{treatment_plan}\n\n{transfer_note}'.strip()
            if treatment_plan
            else transfer_note
        )
        encounter.status = Encounter.Status.COMPLETED
        encounter.completed_at = timezone.now()
        encounter.save(update_fields=[
            'treatment_plan',
            'status',
            'completed_at',
            'updated_at',
        ])

        if encounter.visit.status == Visit.Status.CHECKED_IN:
            encounter.visit.status = Visit.Status.IN_PROGRESS
            encounter.visit.save(update_fields=['status', 'updated_at'])

        new_encounter = Encounter.objects.create(
            visit=encounter.visit,
            parent_encounter=encounter,
            department=department,
            doctor=None,
            status=Encounter.Status.VITALS_DONE,
            chief_complaint=reason,
            created_by=staff,
        )

        serializer = self.get_serializer(new_encounter)
        return Response(serializer.data, status=201)



class ConsultationQueueView(AuditTrailMixin, generics.ListAPIView):
    serializer_class = ConsultationQueueSerializer
    permission_classes = [IsDoctorOrAdmin]
    queryset = (
        Encounter.objects
        .filter(
            active=True,
            status=Encounter.Status.VITALS_DONE,
        )
        .select_related(
            'visit',
            'visit__medical_record',
            'visit__medical_record__patient',
            'department',
            'doctor',
            'doctor__staff',
            'doctor__staff__user',
        ).prefetch_related(
            'vital_signs',
        )
    )
    filter_backends = [filters.SearchFilter, filters.OrderingFilter,]
    search_fields = [
        'visit__visit_number',
        'visit__medical_record__patient__full_name',
        'visit__medical_record__patient__phone',
        'department__name',
    ]
    ordering_fields = ['visit__arrived_at', 'created_at',]
    ordering = ['visit__arrived_at',]

    def get_queryset(self):
        queryset = super().get_queryset()
        staff = getattr(self.request.user, 'staff_profile', None)

        if not staff or staff.role != staff.Role.DOCTOR:
            return queryset

        if not staff.department_id:
            return queryset.none()

        return queryset.filter(department_id=staff.department_id)
