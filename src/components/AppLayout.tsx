import { Link, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from './BottomNav'

const navigation = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Map', path: '/map' },
  { label: 'Report', path: '/report' },
  { label: 'Chat', path: '/chat' },
]

export default function AppLayout() {
  const location = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {/* Desktop navigation */}
      <header className="hidden border-b border-slate-200 bg-white md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            to="/dashboard"
            className="text-xl font-black tracking-tight"
          >
            ACCESS
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-2">
            {navigation.map((item) => {
              const active = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}