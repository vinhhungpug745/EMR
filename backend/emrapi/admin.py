from django.contrib import admin

from .models import (
    AuditLog,
    Department,
    DoctorProfile,
    Encounter,
    LabTechnicianProfile,
    LabTest,
    LabTestCatalog,
    MedicalAttachment,
    MedicalRecord,
    Medication,
    NurseProfile,
    Patient,
    Prescription,
    PrescriptionItem,
    ReceptionistProfile,
    StaffProfile,
    Visit,
    VitalSign,
)


admin.site.site_header = 'EMR Care - Quản trị hệ thống'
admin.site.site_title = 'EMR Care Admin'
admin.site.index_title = 'Danh mục và dữ liệu hệ thống'


class ClinicalReadOnlyAdmin(admin.ModelAdmin):
    """Clinical changes must use the API's workflow, permissions and audit trail."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'active', 'updated_at')
    list_filter = ('active',)
    search_fields = ('name',)


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('employee_code', 'user', 'role', 'department', 'active')
    list_filter = ('role', 'department', 'active')
    search_fields = (
        'employee_code', 'user__username', 'user__first_name',
        'user__last_name',
    )
    autocomplete_fields = ('user', 'department')
    list_select_related = ('user', 'department')


class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ('staff', 'active', 'updated_at')
    list_filter = ('active',)
    search_fields = (
        'staff__employee_code', 'staff__user__username',
        'staff__user__first_name', 'staff__user__last_name',
    )
    autocomplete_fields = ('staff',)
    list_select_related = ('staff', 'staff__user')


@admin.register(ReceptionistProfile)
class ReceptionistProfileAdmin(ProfessionalProfileAdmin):
    list_display = ('staff', 'counter_number', 'shift', 'active')


@admin.register(NurseProfile)
class NurseProfileAdmin(ProfessionalProfileAdmin):
    list_display = ('staff', 'care_unit', 'shift', 'active')


@admin.register(DoctorProfile)
class DoctorProfileAdmin(ProfessionalProfileAdmin):
    list_display = ('staff', 'specialty', 'license_number', 'active')
    search_fields = ProfessionalProfileAdmin.search_fields + ('license_number',)


@admin.register(LabTechnicianProfile)
class LabTechnicianProfileAdmin(ProfessionalProfileAdmin):
    list_display = ('staff', 'laboratory_unit', 'specialization', 'active')


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'active_ingredient', 'strength', 'route', 'active')
    list_filter = ('route', 'active')
    search_fields = ('code', 'name', 'active_ingredient')


@admin.register(LabTestCatalog)
class LabTestCatalogAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'specimen_type', 'active')
    list_filter = ('category', 'active')
    search_fields = ('code', 'name', 'category')


@admin.register(Patient)
class PatientAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'full_name', 'date_of_birth', 'gender', 'created_at')
    list_filter = ('gender', 'active')
    search_fields = ('full_name', 'phone', 'health_insurance_code')


@admin.register(MedicalRecord)
class MedicalRecordAdmin(ClinicalReadOnlyAdmin):
    list_display = ('record_number', 'patient', 'created_at')
    search_fields = ('record_number', 'patient__full_name')
    list_select_related = ('patient',)


@admin.register(Visit)
class VisitAdmin(ClinicalReadOnlyAdmin):
    list_display = ('visit_number', 'medical_record', 'status', 'arrived_at')
    list_filter = ('status', 'visit_type', 'active')
    search_fields = ('visit_number', 'medical_record__record_number')
    list_select_related = ('medical_record',)


@admin.register(Encounter)
class EncounterAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'visit', 'department', 'doctor', 'status', 'created_at')
    list_filter = ('status', 'department', 'active')
    search_fields = ('visit__visit_number', 'visit__medical_record__record_number')
    list_select_related = ('visit', 'department', 'doctor')


@admin.register(VitalSign)
class VitalSignAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'encounter', 'recorded_by', 'created_at')
    search_fields = ('encounter__visit__visit_number',)
    list_select_related = ('encounter', 'recorded_by')


@admin.register(Prescription)
class PrescriptionAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'encounter', 'prescribed_by', 'status', 'created_at')
    list_filter = ('status', 'active')
    search_fields = ('encounter__visit__visit_number',)
    list_select_related = ('encounter', 'prescribed_by')


@admin.register(PrescriptionItem)
class PrescriptionItemAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'prescription', 'medication', 'dosage', 'quantity')
    search_fields = ('prescription__id', 'medication__name', 'medication__code')
    list_select_related = ('prescription', 'medication')


@admin.register(LabTest)
class LabTestAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'test_catalog', 'encounter', 'status', 'ordered_at')
    list_filter = ('status', 'test_catalog__category', 'active')
    search_fields = ('test_catalog__name', 'encounter__visit__visit_number')
    list_select_related = ('test_catalog', 'encounter')


@admin.register(MedicalAttachment)
class MedicalAttachmentAdmin(ClinicalReadOnlyAdmin):
    list_display = ('id', 'title', 'encounter', 'uploaded_by', 'created_at')
    search_fields = ('title', 'encounter__visit__visit_number')
    list_select_related = ('encounter', 'uploaded_by')


@admin.register(AuditLog)
class AuditLogAdmin(ClinicalReadOnlyAdmin):
    list_display = ('created_at', 'actor', 'action', 'resource_type', 'resource_id')
    list_filter = ('action', 'resource_type')
    search_fields = ('actor__username', 'resource_type', 'resource_id', 'description')
    list_select_related = ('actor',)
