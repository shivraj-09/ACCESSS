import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading ACCESS...</p>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}