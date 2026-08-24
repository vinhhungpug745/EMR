# emrapi/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

from emrapi.models import StaffProfile


def get_active_staff(user):
    """Trả về StaffProfile đang active của user, hoặc None."""
    if not user or not user.is_authenticated or not user.is_active:
        return None
    staff = getattr(user, 'staff_profile', None)
    if staff and staff.active:
        return staff
    return None


class HasStaffRole(BasePermission):
    allowed_roles = []
    message = 'Bạn không có quyền truy cập chức năng này.'

    def has_permission(self, request, view):
        staff = get_active_staff(request.user)
        if not staff:
            return False
        request.staff_profile = staff  # tiện dùng lại trong view
        return staff.role in self.allowed_roles


class IsEMRAdmin(HasStaffRole):
    message = 'Chỉ quản trị viên EMR mới có quyền truy cập.'
    allowed_roles = [StaffProfile.Role.ADMIN]


class IsReceptionist(HasStaffRole):
    message = 'Chỉ nhân viên tiếp nhận mới có quyền truy cập.'
    allowed_roles = [StaffProfile.Role.RECEPTIONIST]


class IsNurse(HasStaffRole):
    message = 'Chỉ điều dưỡng mới có quyền truy cập.'
    allowed_roles = [StaffProfile.Role.NURSE]


class IsDoctor(HasStaffRole):
    message = 'Chỉ bác sĩ mới có quyền truy cập.'
    allowed_roles = [StaffProfile.Role.DOCTOR]


class IsLabTechnician(HasStaffRole):
    message = 'Chỉ nhân viên xét nghiệm mới có quyền truy cập.'
    allowed_roles = [StaffProfile.Role.LAB_TECHNICIAN]


class IsReceptionistOrAdmin(HasStaffRole):
    allowed_roles = [StaffProfile.Role.RECEPTIONIST, StaffProfile.Role.ADMIN]


class IsDoctorOrAdmin(HasStaffRole):
    allowed_roles = [StaffProfile.Role.DOCTOR, StaffProfile.Role.ADMIN]


class IsNurseOrAdmin(HasStaffRole):
    allowed_roles = [StaffProfile.Role.NURSE, StaffProfile.Role.ADMIN]


class IsLabTechnicianOrAdmin(HasStaffRole):
    allowed_roles = [StaffProfile.Role.LAB_TECHNICIAN, StaffProfile.Role.ADMIN]


class IsClinicalStaff(HasStaffRole):
    """Nurse, Doctor, Lab tech - nhung nguoi truc tiep tham gia kham chua benh."""
    allowed_roles = [
        StaffProfile.Role.NURSE,
        StaffProfile.Role.DOCTOR,
        StaffProfile.Role.LAB_TECHNICIAN,
    ]


class IsAnyStaff(HasStaffRole):
    """Bat ky nhan vien active nao, dung cho endpoint chi can dang nhap noi bo."""
    allowed_roles = [r.value for r in StaffProfile.Role]


class IsAssignedDoctorOrAdmin(HasStaffRole):
    """
    Dung cho Encounter, Prescription, LabTest (qua encounter):
    bac si chi thao tac tren encounter cua chinh minh, admin thi toan quyen.
    """
    allowed_roles = [StaffProfile.Role.DOCTOR, StaffProfile.Role.ADMIN]

    def has_object_permission(self, request, view, obj):
        staff = request.staff_profile
        if staff.role == StaffProfile.Role.ADMIN:
            return True
        # obj co the la Encounter, hoac co attribute .encounter (Prescription, LabTest)
        encounter = obj if hasattr(obj, 'doctor') else getattr(obj, 'encounter', None)
        if encounter is None:
            return False
        doctor_profile = getattr(staff, 'doctor_profile', None)
        return encounter.doctor_id == getattr(doctor_profile, 'id', None)


class CanEditOpenEncounterOnly(BasePermission):
    """
    Chan sua encounter/vital sign khi da completed hoac cancelled,
    tru admin. Dung ket hop voi role permission khac qua AND (&).
    """
    message = 'Lượt khám đã hoàn thành/hủy, không thể chỉnh sửa.'

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        staff = getattr(request, 'staff_profile', None)
        if staff and staff.role == StaffProfile.Role.ADMIN:
            return True
        encounter = obj if hasattr(obj, 'status') and hasattr(obj, 'doctor') else getattr(obj, 'encounter', None)
        if encounter is None:
            return True
        return encounter.status not in ('completed', 'cancelled')