from django.db import transaction
from rest_framework import filters, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from emrapi.models import Encounter, Prescription, StaffProfile
from emrapi.permission import IsAnyStaff
from emrapi.serializers import PrescriptionSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAnyStaff]
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
            raise PermissionDenied('Chi bac si moi duoc lap don thuoc.')

        encounter = (
            Encounter.objects
            .select_for_update()
            .filter(pk=serializer.validated_data['encounter'].pk)
            .first()
        )

        if not encounter or not encounter.active:
            raise ValidationError({
                'encounter': 'Luot kham khong ton tai hoac da ngung hoat dong.'
            })

        if encounter.doctor_id != doctor_profile.id:
            raise PermissionDenied(
                'Bac si chi duoc ke don cho luot kham cua minh.'
            )

        if encounter.status != Encounter.Status.IN_PROGRESS:
            raise ValidationError({
                'encounter': 'Chi duoc ke don khi luot kham dang dien ra.'
            })

        serializer.save()

    @transaction.atomic
    def perform_update(self, serializer):
        staff = self.request.staff_profile
        instance = serializer.instance
        doctor_profile = getattr(staff, 'doctor_profile', None)

        if not instance.active:
            raise ValidationError('Don thuoc nay da ngung hoat dong.')

        if staff.role == StaffProfile.Role.ADMIN:
            serializer.save()
            return

        if staff.role != StaffProfile.Role.DOCTOR or not doctor_profile:
            raise PermissionDenied('Chi bac si moi duoc cap nhat don thuoc.')

        if instance.prescribed_by_id != doctor_profile.id:
            raise PermissionDenied(
                'Bac si chi duoc cap nhat don thuoc cua minh.'
            )

        if instance.status == Prescription.Status.CANCELLED:
            raise ValidationError({
                'status': 'Don thuoc da huy khong the cap nhat.'
            })

        serializer.save()
