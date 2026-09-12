import { Link, useLocation } from 'react-router-dom'

const navigation = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: '⌂',
  },
  {
    label: 'Map',
    path: '/map',
    icon: '⌖',
  },
  {
    label: 'Report',
    path: '/report',
    icon: '+',
  },
  {
    label: 'Chat',
    path: '/chat',
    icon: '✦',
  },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navigation.map((item) => {
          const active = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                active
                  ? 'text-slate-950'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-lg ${
                  active ? 'bg-slate-950 text-white' : ''
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}