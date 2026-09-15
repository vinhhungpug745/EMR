from .auth import CurrentUserView, LoginView, LogoutView
from .department import DepartmentViewSet
from .lab_test_catalog import LabTestCatalogViewSet
from .lab_test import LabTestViewSet,LabTechnicianQueueView
from .medication import MedicationViewSet
from .medical_record import MedicalRecordViewSet
from .medical_attachment import MedicalAttachmentViewSet
from .user import UserViewSet
from .staff_profile import StaffProfileViewSet,MyProfileView
from .patient import PatientViewSet
from .prescription import PrescriptionViewSet
from .encounter import EncounterViewSet, ConsultationQueueView
from .visit import VisitViewSet
from .vital_sign import VitalSignViewSet, VitalSignQueueView

__all__ = [
    'CurrentUserView',
    'LoginView',
    'LogoutView',
    'DepartmentViewSet',
    'LabTestCatalogViewSet',
    'LabTestViewSet',
    'LabTechnicianQueueView',
    'MedicationViewSet',
    'MedicalRecordViewSet',
    'MedicalAttachmentViewSet',
    'UserViewSet',
    'StaffProfileViewSet',
    'MyProfileView',
    'PatientViewSet',
    'PrescriptionViewSet',
    'EncounterViewSet',
    'VisitViewSet',
    'VitalSignViewSet',
    'VitalSignQueueView',
    'ConsultationQueueView'
]
