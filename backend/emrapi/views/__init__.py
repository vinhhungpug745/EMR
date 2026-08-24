from .auth import CurrentUserView, LoginView, LogoutView
from .department import DepartmentViewSet
from .lab_test_catalog import LabTestCatalogViewSet
from .medication import MedicationViewSet
from .user import UserViewSet
from .staff_profile import StaffProfileViewSet,MyProfileView
from .patient import PatientViewSet
from .encounter import EncounterViewSet
from .visit import VisitViewSet
from .vital_sign import VitalSignViewSet,NurseQueueView

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
    'PatientViewSet',
    'EncounterViewSet',
    'VisitViewSet',
    'VitalSignViewSet',
    'NurseQueueView',
]
