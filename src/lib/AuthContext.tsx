import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type DemoUser = { id: 'judge-1' | 'judge-2'; name: string; role: string }
type AuthContextType = { session: Session | null; loading: boolean; demoUser: DemoUser | null; enterDemo: (id: DemoUser['id']) => void; exitDemo: () => void }
const demoUsers: Record<DemoUser['id'], DemoUser> = {
  'judge-1': { id: 'judge-1', name: 'Alex Morgan', role: 'Accessibility Explorer' },
  'judge-2': { id: 'judge-2', name: 'Sam Rivera', role: 'Community Reporter' },
}
const AuthContext = createContext<AuthContextType>({ session: null, loading: true, demoUser: null, enterDemo: () => undefined, exitDemo: () => undefined })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [demoUser, setDemoUser] = useState<DemoUser | null>(() => {
    const saved = localStorage.getItem('access-demo-user') as DemoUser['id'] | null
    return saved ? demoUsers[saved] ?? null : null
  })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setLoading(false) } })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false) })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])
  function enterDemo(id: DemoUser['id']) { localStorage.setItem('access-demo-user', id); setDemoUser(demoUsers[id]) }
  function exitDemo() { localStorage.removeItem('access-demo-user'); setDemoUser(null) }
  return <AuthContext.Provider value={{ session, loading, demoUser, enterDemo, exitDemo }}>{children}</AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }