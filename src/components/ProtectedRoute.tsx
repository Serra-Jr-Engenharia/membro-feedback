import { useAuth } from '../hooks/AuthProvider'
import { Navigate, useLocation } from 'react-router-dom'

type ProtectedRouteProps = {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { profile } = useAuth()
  const location = useLocation()

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}