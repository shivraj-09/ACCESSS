import { Link, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from './BottomNav'
import { Bot, LogOut, Map, MapPinPlus, Sparkles } from 'lucide-react'

const navigation = [
  { label: 'Home', path: '/dashboard', icon: Sparkles },
  { label: 'Explore', path: '/map', icon: Map },
  { label: 'Report', path: '/report', icon: MapPinPlus },
  { label: 'AI Assistant', path: '/chat', icon: Bot },
]

export default function AppLayout() {
  const location = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="access-glass sticky top-0 z-[1100] hidden border-b border-slate-200/70 md:block">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <span className="access-pulse flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
              <span className="text-lg font-black">A</span>
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight">ACCESS</span>
              <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Accessibility intelligence</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/70 p-1 shadow-sm">
            {navigation.map((item) => {
              const active = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${active ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-950'}`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-950"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}