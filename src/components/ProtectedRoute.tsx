import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute() {
  const { session, demoUser, loading } = useAuth()
  if (loading) return <main className="min-h-screen bg-[#f4f1ea] text-[#18211d] flex items-center justify-center"><p className="text-sm font-semibold text-slate-500">Opening ACCESS…</p></main>
  if (!session && !demoUser) return <Navigate to="/" replace />
  return <Outlet />
}