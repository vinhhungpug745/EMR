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
import PatientPage from './pages/receptionist/PatientPage'
import ReceptionPage from './pages/receptionist/ReceptionPage'
import VitalSignQueuePage from './pages/nurse/VitalSignQueuePage'
import VitalSignsPage from './pages/nurse/VitalSignPage'
import ConsultationQueuePage from './pages/doctor/ConsultationQueuePage'
import EncounterExamPage from './pages/doctor/EncounterExamPage'
import EncounterListPage from './pages/doctor/EncounterListPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="staff" element={<StaffProfileManagementPage />} />
          <Route path="departments" element={<DepartmentPage />} />
          <Route path="medications" element={<MedicationPage />} />
          <Route path="lab-test-catalogs" element={<LabTestCatalogPage />} />
          <Route path="patients" element={<PatientPage />} />
          <Route path="medical-records" element={<MedicalRecordPage />} />
          <Route path="reception" element={<ReceptionPage />} />
          <Route path="vital-sign-queue" element={<VitalSignQueuePage />} />
          <Route path="vital-signs" element={<VitalSignsPage />} />
          <Route path="consultation-queue" element={<ConsultationQueuePage />} />
          <Route path="encounters" element={<EncounterListPage />} />
          <Route path="encounters/:encounterId" element={<EncounterExamPage />} />
          <Route path=":moduleId" element={<ModulePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
