import { Link, useLocation } from 'react-router-dom'
import { Bot, Map, MapPinPlus, Sparkles } from 'lucide-react'

const navigation = [
  { label: 'Home', path: '/dashboard', icon: Sparkles },
  { label: 'Map', path: '/map', icon: Map },
  { label: 'Report', path: '/report', icon: MapPinPlus },
  { label: 'Chat', path: '/chat', icon: Bot },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav aria-label="Main navigation" className="access-glass fixed bottom-0 left-0 right-0 z-[1200] border-t border-slate-200/80 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,.08)] md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1">
        {navigation.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-slate-950' : 'text-slate-400 hover:text-slate-700'}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && <span className="absolute top-0 h-1 w-8 rounded-full bg-emerald-500" />}
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-100/80'}`}>
                <Icon size={17} />
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}