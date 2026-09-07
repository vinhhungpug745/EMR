import uuid
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from .utils import calculate_years_of_experience
from .validators import validate_not_future_date


def generate_visit_number():
    return f'VIS-{uuid.uuid4().hex[:12].upper()}'


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Department(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class GenderChoices(models.TextChoices):
    MALE = 'male', 'Nam'
    FEMALE = 'female', 'Nữ'
    OTHER = 'other', 'Khác'

class StaffProfile(BaseModel):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Quan tri vien'
        RECEPTIONIST = 'receptionist', 'Nhan vien tiep nhan'
        NURSE = 'nurse', 'Dieu duong'
        DOCTOR = 'doctor', 'Bac si'
        LAB_TECHNICIAN = 'lab_technician', 'Nhan vien xet nghiem'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name='staff_members',
        blank=True,
        null=True,
    )
    role = models.CharField(max_length=32, choices=Role.choices)
    employee_code = models.CharField(max_length=64, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=12,choices=GenderChoices.choices,blank=True,null=True,)

    class Meta:
        ordering = ['role', 'employee_code']
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['employee_code']),
        ]

    def __str__(self):
        display_name = self.user.get_full_name() or self.user.username
        return f'{display_name} - {self.get_role_display()}'


class Patient(BaseModel):
    full_name = models.CharField(max_length=160)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=12,choices=GenderChoices.choices,blank=True,null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    citizen_id = models.CharField(max_length=32, unique=True, blank=True, null=True)
    health_insurance_code = models.CharField(max_length=64, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=160, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['full_name']),
            models.Index(fields=['phone']),
            models.Index(fields=['health_insurance_code']),
        ]

    def __str__(self):
        return self.full_name


class ReceptionistProfile(BaseModel):
    staff = models.OneToOneField(StaffProfile, on_delete=models.CASCADE, related_name='receptionist_profile')
    counter_number = models.CharField(max_length=30, blank=True, null=True)
    shift = models.CharField(max_length=60, blank=True, null=True)
    assigned_area = models.CharField(max_length=120, blank=True, null=True)
    handles_health_insurance = models.BooleanField(default=False)
    career_start_date = models.DateField(blank=True, null=True, validators=[validate_not_future_date])

    class Meta:
        ordering = ['staff__employee_code']

    def __str__(self):
        return f'Tiep nhan - {self.staff}'

    @property
    def years_of_experience(self):
        return calculate_years_of_experience(self.career_start_date)

    def clean(self):
        if self.staff_id and self.staff.role != StaffProfile.Role.RECEPTIONIST:
            raise ValidationError({'staff': 'Nhan vien phai co vai tro tiep nhan.'})


class NurseProfile(BaseModel):
    staff = models.OneToOneField(StaffProfile, on_delete=models.CASCADE, related_name='nurse_profile')
    nursing_license_number = models.CharField(max_length=64, unique=True, blank=True, null=True)
    care_unit = models.CharField(max_length=120, blank=True, null=True)
    professional_qualification = models.CharField(max_length=120, blank=True, null=True)
    professional_rank = models.CharField(max_length=120, blank=True, null=True)
    practice_start_date = models.DateField(blank=True, null=True,validators=[validate_not_future_date])
    shift = models.CharField(max_length=60, blank=True, null=True)

    class Meta:
        ordering = ['staff__employee_code']

    def __str__(self):
        return f'Dieu duong - {self.staff}'

    @property
    def years_of_experience(self):
        return calculate_years_of_experience(self.practice_start_date)

    def clean(self):
        if self.staff_id and self.staff.role != StaffProfile.Role.NURSE:
            raise ValidationError({'staff': 'Nhan vien phai co vai tro dieu duong.'})


class DoctorProfile(BaseModel):
    staff = models.OneToOneField(StaffProfile, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=120)
    license_number = models.CharField(max_length=64, unique=True)
    academic_title = models.CharField(max_length=120, blank=True, null=True)
    degree = models.CharField(max_length=120, blank=True, null=True)
    license_issue_date = models.DateField(blank=True, null=True, validators=[validate_not_future_date])
    license_issued_by = models.CharField(max_length=160, blank=True, null=True)
    practice_start_date = models.DateField(blank=True, null=True,validators=[validate_not_future_date])
    scope_of_practice = models.TextField(blank=True, null=True)
    consultation_room = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        ordering = ['staff__department__name', 'specialty']

    def __str__(self):
        display_name = self.staff.user.get_full_name() or self.staff.user.username
        return f'{display_name} - {self.specialty}'

    @property
    def years_of_experience(self):
        return calculate_years_of_experience(self.practice_start_date)

    def clean(self):
        if self.staff_id and self.staff.role != StaffProfile.Role.DOCTOR:
            raise ValidationError({'staff': 'Nhan vien phai co vai tro bac si.'})


class LabTechnicianProfile(BaseModel):
    staff = models.OneToOneField(StaffProfile, on_delete=models.CASCADE, related_name='lab_technician_profile')
    laboratory_unit = models.CharField(max_length=120, blank=True, null=True)
    certification_number = models.CharField(max_length=64, unique=True, blank=True, null=True)
    specialization = models.CharField(max_length=120, blank=True, null=True)
    professional_qualification = models.CharField(max_length=120, blank=True, null=True)
    practice_start_date = models.DateField( blank=True, null=True, validators=[validate_not_future_date],)

    class Meta:
        ordering = ['staff__employee_code']

    def __str__(self):
        return f'Xet nghiem - {self.staff}'

    @property
    def years_of_experience(self):
        return calculate_years_of_experience(self.practice_start_date)

    def clean(self):
        if self.staff_id and self.staff.role != StaffProfile.Role.LAB_TECHNICIAN:
            raise ValidationError({'staff': 'Nhan vien phai co vai tro xet nghiem.'})


class Visit(BaseModel):
    class VisitType(models.TextChoices):
        OUTPATIENT = 'outpatient', 'Ngoại trú'

    class Status(models.TextChoices):
        CHECKED_IN = 'checked_in', 'Da tiep nhan'
        IN_PROGRESS = 'in_progress', 'Dang kham'
        COMPLETED = 'completed', 'Hoan thanh'
        CANCELLED = 'cancelled', 'Da huy'

    medical_record = models.ForeignKey(
        'MedicalRecord',
        on_delete=models.CASCADE,
        related_name='visits',
    )
    visit_number = models.CharField(
        max_length=32,
        unique=True,
        default=generate_visit_number,
        editable=False,
    )
    visit_type = models.CharField(
        max_length=20,
        choices=VisitType.choices,
        default=VisitType.OUTPATIENT,
    )
    arrived_at = models.DateTimeField()
    completed_at = models.DateTimeField(blank=True, null=True)
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CHECKED_IN)
    note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        related_name='created_visits',
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ['-arrived_at']
        indexes = [
            models.Index(fields=['arrived_at'], name='emrapi_vis_arrived_35a117_idx'),
            models.Index(fields=['status'], name='emrapi_vis_status_4cbf6d_idx'),
            models.Index(
                fields=['medical_record', 'arrived_at'],
                name='emrapi_vis_record_32d17d_idx',
            ),
        ]

    def __str__(self):
        return f'{self.visit_number} - {self.medical_record.patient.full_name}'

    def clean(self):
        if self._state.adding and self.visit_type != self.VisitType.OUTPATIENT:
            raise ValidationError({'visit_type': 'Hệ thống chỉ tiếp nhận khám ngoại trú.'})
        if self.status == self.Status.COMPLETED and not self.completed_at:
            raise ValidationError({'completed_at': 'Lan den da hoan thanh phai co thoi gian ket thuc.'})
        if self.completed_at and self.completed_at < self.arrived_at:
            raise ValidationError({'completed_at': 'Thoi gian ket thuc khong duoc truoc thoi gian tiep nhan.'})


class MedicalRecord(BaseModel):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='medical_record')
    record_number = models.CharField(max_length=64, unique=True)
    blood_type = models.CharField(max_length=8, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        related_name='created_medical_records',
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ['record_number']

    def __str__(self):
        return f'{self.record_number} - {self.patient.full_name}'


class Encounter(BaseModel):
    class Status(models.TextChoices):
        CHECKED_IN = 'checked_in', 'Chờ đo sinh hiệu'
        VITALS_DONE = 'vitals_done', 'Đã đo sinh hiệu'
        IN_PROGRESS = 'in_progress', 'Đang khám'
        COMPLETED = 'completed', 'Hoàn thành'
        CANCELLED = 'cancelled', 'Đã hủy'

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name='encounters',
    )
    parent_encounter = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='referred_encounters',
        blank=True,
        null=True,
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name='encounters',
        blank=True,
        null=True,
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.SET_NULL,
        related_name='encounters',
        blank=True,
        null=True,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CHECKED_IN)
    started_at = models.DateTimeField(blank=True,null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    chief_complaint = models.CharField(max_length=255)
    diagnosis = models.TextField(blank=True, null=True)
    treatment_plan = models.TextField(blank=True, null=True)
    follow_up_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        related_name='created_encounters',
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['started_at'], name='emrapi_enc_started_6a2558_idx'),
            models.Index(fields=['status'], name='emrapi_enco_status_e1b572_idx'),
            models.Index(
                fields=['visit', 'started_at'],
                name='emrapi_enc_visit_46bb1f_idx',
            ),
            models.Index(
                fields=['department', 'status'],
                name='emrapi_enc_dept_8acc95_idx',
            ),
        ]

    def __str__(self):
        patient_name = self.visit.medical_record.patient.full_name

        if self.started_at:
            return f'{patient_name} - {self.started_at:%Y-%m-%d %H:%M}'

        return f'{patient_name} - Chờ khám'

    def clean(self):
        if self.parent_encounter_id:
            if self.pk and self.parent_encounter_id == self.pk:
                raise ValidationError({'parent_encounter': 'Luot kham khong the tu chuyen den chinh no.'})
            if self.visit_id and self.parent_encounter.visit_id != self.visit_id:
                raise ValidationError({'parent_encounter': 'Luot kham chuyen khoa phai thuoc cung mot lan den.'})
        if self.status == self.Status.COMPLETED:
            if not self.diagnosis:
                raise ValidationError({'diagnosis': 'Luot kham hoan thanh phai co chan doan.'})
            if not self.completed_at:
                raise ValidationError({'completed_at': 'Luot kham hoan thanh phai co thoi gian ket thuc.'})
        if (
                self.completed_at
                and self.started_at
                and self.completed_at < self.started_at
        ):
            raise ValidationError({
                'completed_at':
                    'Thoi gian ket thuc khong duoc truoc thoi gian bat dau.'
            })


class VitalSign(BaseModel):
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name='vital_signs')
    recorded_by = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        related_name='recorded_vital_signs',
        blank=True,
        null=True,
    )
    temperature = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    pulse = models.PositiveSmallIntegerField(blank=True, null=True)
    systolic_bp = models.PositiveSmallIntegerField(blank=True, null=True)
    diastolic_bp = models.PositiveSmallIntegerField(blank=True, null=True)
    respiratory_rate = models.PositiveSmallIntegerField(blank=True, null=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f'Sinh hieu lan kham #{self.encounter_id}'


class Medication(BaseModel):
    class Route(models.TextChoices):
        ORAL = 'oral', 'Duong uong'
        TOPICAL = 'topical', 'Dung ngoai'
        INHALATION = 'inhalation', 'Duong hit'
        INJECTION = 'injection', 'Duong tiem'
        OTHER = 'other', 'Khac'

    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=160)
    active_ingredient = models.CharField(max_length=160)
    strength = models.CharField(max_length=80)
    dosage_form = models.CharField(max_length=80)
    unit = models.CharField(max_length=40)
    route = models.CharField(max_length=20, choices=Route.choices)

    class Meta:
        ordering = ['name', 'strength']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['active_ingredient']),
        ]

    def __str__(self):
        return f'{self.name} {self.strength}'


class Prescription(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Nhap'
        ISSUED = 'issued', 'Da ke'
        CANCELLED = 'cancelled', 'Da huy'

    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name='prescriptions')
    prescribed_by = models.ForeignKey(
        DoctorProfile,
        on_delete=models.SET_NULL,
        related_name='prescriptions',
        blank=True,
        null=True,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    note = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Don thuoc #{self.pk}'


class PrescriptionItem(BaseModel):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medication = models.ForeignKey(
        Medication,
        on_delete=models.PROTECT,
        related_name='prescription_items',
        blank=True,
        null=True,
    )
    dosage = models.CharField(max_length=120)
    frequency = models.CharField(max_length=120)
    duration = models.CharField(max_length=120)
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    instruction = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(
                fields=['prescription', 'medication'],
                name='unique_medication_per_prescription',
            ),
        ]

    def __str__(self):
        return f'{self.medication} - {self.dosage}'


class LabTestCatalog(BaseModel):
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=160, unique=True)
    category = models.CharField(max_length=120, blank=True, null=True)
    specimen_type = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='emrapi_labcat_name_565115_idx'),
            models.Index(fields=['category'], name='emrapi_labcat_cat_55b04e_idx'),
        ]

    def __str__(self):
        return f'{self.code} - {self.name}'


class LabTest(BaseModel):
    class Status(models.TextChoices):
        ORDERED = 'ordered', 'Da chi dinh'
        PROCESSING = 'processing', 'Dang xu ly'
        COMPLETED = 'completed', 'Da co ket qua'
        CANCELLED = 'cancelled', 'Da huy'

    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name='lab_tests')
    test_catalog = models.ForeignKey(
        LabTestCatalog,
        on_delete=models.PROTECT,
        related_name='lab_tests',
    )
    ordered_by = models.ForeignKey(
        DoctorProfile,
        on_delete=models.SET_NULL,
        related_name='ordered_lab_tests',
        blank=True,
        null=True,
    )
    performed_by = models.ForeignKey(
        LabTechnicianProfile,
        on_delete=models.SET_NULL,
        related_name='performed_lab_tests',
        blank=True,
        null=True,
    )
    ordered_at = models.DateTimeField(auto_now_add=True)
    performed_at = models.DateTimeField(blank=True, null=True)
    result = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ORDERED)

    class Meta:
        ordering = ['-ordered_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['ordered_at']),
        ]

    def __str__(self):
        return self.test_catalog.name


class MedicalAttachment(BaseModel):
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        related_name='uploaded_attachments',
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=160)
    file = models.FileField(upload_to='medical_attachments/%Y/%m/')
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'create', 'Tao moi'
        VIEW = 'view', 'Xem'
        UPDATE = 'update', 'Cap nhat'
        DELETE = 'delete', 'Xoa'
        LOGIN = 'login', 'Dang nhap'
        LOGIN_FAILED = 'login_failed', 'Dang nhap that bai'
        LOGOUT = 'logout', 'Dang xuat'

    actor = models.ForeignKey(User,on_delete=models.SET_NULL,related_name='audit_logs', blank=True,null=True)

    action = models.CharField(max_length=20, choices=Action.choices)
    resource_type = models.CharField(max_length=120)
    resource_id = models.CharField(max_length=64, blank=True, null=True)
    resource_repr = models.CharField(max_length=255, blank=True, null=True)
    changes = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    request_method = models.CharField(max_length=10, blank=True, null=True)
    request_path = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else 'system'
        return f'{actor_name} - {self.get_action_display()} - {self.resource_type}'
