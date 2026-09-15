from .auth import AuthenticatedUserSerializer, LoginSerializer, LogoutSerializer
from .audit_log import AuditLogSerializer
from .department import DepartmentSerializer, DepartmentSummarySerializer
from .doctor_profile import DoctorProfileSerializer, DoctorProfileSummarySerializer
from .encounter import EncounterSerializer, EncounterSummarySerializer, ConsultationQueueSerializer
from .lab_technician_profile import LabTechnicianProfileSerializer, LabTechnicianProfileSummarySerializer
from .lab_test import LabTestSerializer
from .lab_test_catalog import LabTestCatalogSerializer, LabTestCatalogSummarySerializer
from .medical_attachment import MedicalAttachmentSerializer
from .medical_record import MedicalRecordSerializer, MedicalRecordSummarySerializer
from .medical_attachment import MedicalAttachmentSerializer
from .medication import MedicationSerializer, MedicationSummarySerializer
from .nurse_profile import NurseProfileSerializer
from .patient import PatientSerializer, PatientSummarySerializer
from .prescription import PrescriptionItemSerializer, PrescriptionSerializer
from .receptionist_profile import ReceptionistProfileSerializer
from .staff_profile import StaffProfileSerializer, StaffProfileSummarySerializer,MyProfileSerializer
from .user import UserSerializer, UserSummarySerializer
from .vital_sign import VitalSignSerializer, VitalSignQueueSerializer
from .visit import VisitSerializer, VisitSummarySerializer

__all__ = [
    'AuthenticatedUserSerializer',
    'LoginSerializer',
    'LogoutSerializer',
    'AuditLogSerializer',
    'DepartmentSerializer',
    'DepartmentSummarySerializer',
    'DoctorProfileSerializer',
    'DoctorProfileSummarySerializer',
    'EncounterSerializer',
    'EncounterSummarySerializer',
    'LabTechnicianProfileSerializer',
    'LabTechnicianProfileSummarySerializer',
    'LabTestSerializer',
    'LabTestCatalogSerializer',
    'LabTestCatalogSummarySerializer',
    'MedicalAttachmentSerializer',
    'MedicalRecordSerializer',
    'MedicalRecordSummarySerializer',
    'MedicationSerializer',
    'MedicationSummarySerializer',
    'NurseProfileSerializer',
    'PatientSerializer',
    'PatientSummarySerializer',
    'PrescriptionItemSerializer',
    'PrescriptionSerializer',
    'ReceptionistProfileSerializer',
    'StaffProfileSerializer',
    'StaffProfileSummarySerializer',
    'MyProfileSerializer',
    'UserSerializer',
    'UserSummarySerializer',
    'VitalSignSerializer',
    'VisitSerializer',
    'VisitSummarySerializer',
    'VitalSignSerializer',
    'VitalSignQueueSerializer',
    'ConsultationQueueSerializer'
]
