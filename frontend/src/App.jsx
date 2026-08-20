import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModulePage } from './pages/ModulePage'
import DepartmentPage from './pages/admin/DepartmentPage'
import LabTestCatalogPage from './pages/admin/LabTestCatalogPage'
import MedicationPage from './pages/admin/MedicationPage'
import StaffProfileManagementPage from './pages/admin/StaffProfileManagementPage'
import UserManagementPage from './pages/admin/UserManagementPage'

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
          <Route path=":moduleId" element={<ModulePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
