from rest_framework.permissions import BasePermission

from emrapi.models import StaffProfile


class IsEMRAdmin(BasePermission):
    message = 'Chi quan tri vien EMR moi co quyen truy cap.'
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.is_active:
            return False

        try:
            staff_profile = request.user.staff_profile
            return (
                staff_profile.active
                and staff_profile.role == StaffProfile.Role.ADMIN
            )
        except StaffProfile.DoesNotExist:
            return False
