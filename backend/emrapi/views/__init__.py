from .auth import CurrentUserView, LoginView, LogoutView
from .department import DepartmentViewSet
from .lab_test_catalog import LabTestCatalogViewSet
from .medication import MedicationViewSet
from .user import UserViewSet
from .staff_profile import StaffProfileViewSet,MyProfileView

__all__ = [
    'CurrentUserView',
    'LoginView',
    'LogoutView',
    'DepartmentViewSet',
    'LabTestCatalogViewSet',
    'MedicationViewSet',
    'UserViewSet',
    'StaffProfileViewSet',
    'MyProfileView',
]
