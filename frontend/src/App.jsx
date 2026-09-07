import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import MedicalRecordPage from './pages/doctor/MedicalRecordPage'
import { ModulePage } from './pages/ModulePage'
import DepartmentPage from './pages/admin/DepartmentPage'
import LabTestCatalogPage from './pages/admin/LabTestCatalogPage'
import MedicationPage from './pages/admin/MedicationPage'
import StaffProfileManagementPage from './pages/admin/StaffProfileManagementPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import ReportPage from './pages/admin/ReportPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import PatientPage from './pages/receptionist/PatientPage'
import ReceptionPage from './pages/receptionist/ReceptionPage'
import VisitPage from './pages/receptionist/VisitPage'
import VitalSignQueuePage from './pages/nurse/VitalSignQueuePage'
import VitalSignsPage from './pages/nurse/VitalSignPage'
import ConsultationQueuePage from './pages/doctor/ConsultationQueuePage'
import EncounterExamPage from './pages/doctor/EncounterExamPage'
import EncounterListPage from './pages/doctor/EncounterListPage'
import LabTechnicianProgressPage from './pages/technician/LabTechnicianProgressPage'
import LabTechnicianQueuePage from './pages/technician/LabTechnicianQueuePage'
import LabTechnicianResultsPage from './pages/technician/LabTechnicianResultsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="reports" element={<ReportPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
            <Route path="staff" element={<StaffProfileManagementPage />} />
            <Route path="departments" element={<DepartmentPage />} />
            <Route path="medications" element={<MedicationPage />} />
            <Route path="lab-test-catalogs" element={<LabTestCatalogPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
            <Route path="patients" element={<PatientPage />} />
            <Route path="reception" element={<ReceptionPage />} />
            <Route path="visits" element={<VisitPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['nurse']} />}>
            <Route path="vital-sign-queue" element={<VitalSignQueuePage />} />
            <Route path="vital-signs" element={<VitalSignsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="consultation-queue" element={<ConsultationQueuePage />} />
            <Route path="encounters" element={<EncounterListPage />} />
            <Route path="encounters/:encounterId" element={<EncounterExamPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor']} />}>
            <Route path="medical-records" element={<MedicalRecordPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['lab_technician']} />}>
            <Route path="lab-technician-queue" element={<LabTechnicianQueuePage />} />
            <Route path="lab-progress" element={<LabTechnicianProgressPage />} />
            <Route path="lab-results" element={<LabTechnicianResultsPage />} />
          </Route>
          <Route path=":moduleId" element={<ModulePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
