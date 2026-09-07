import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingScreen } from '../components/common/LoadingScreen'
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
