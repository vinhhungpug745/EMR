import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingScreen } from '../components/common/LoadingScreen'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { InactiveProfilePage } from '../pages/InactiveProfilePage'
import { useAuth } from './useAuth'

export function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.staff_active === false) {
    return <InactiveProfilePage />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage />
  }

  return <Outlet />
}
