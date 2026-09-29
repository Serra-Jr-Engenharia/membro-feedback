import { useAuth } from '../hooks/AuthProvider'
import { Navigate, useLocation } from 'react-router-dom'

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean; 
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-azulEscuroPage text-gray-200">
        Carregando...
      </div>
    )
  }

  // regra 1: não está logado, vai para login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // regra 2: rota de admin, porém user não é admin, volta à tela principal (de membro comum)
  if (requireAdmin && profile?.user_role !== 'Admin') {
    return <Navigate to="/" replace />
  }

  // regra 3: rota de membrom comum, porém logada com user admin, vai para a tela de admin
  if (!requireAdmin && profile?.user_role === 'Admin') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}