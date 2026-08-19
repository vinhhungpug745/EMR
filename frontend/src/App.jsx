import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModulePage } from './pages/ModulePage'
import StaffProfileManagementPage from './pages/staff/StaffProfileManagementPage'
import UserManagementPage from './pages/users/UserManagementPage'
import DepartmentPage from './pages/departments/DepartmentPage'

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
          <Route path=":moduleId" element={<ModulePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
