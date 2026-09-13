import { useEffect, useState } from 'react'
import { ArrowRight, Bot, CheckCircle2, Map, MapPin, Plus, Sparkles, Route, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type Report = { id: string; latitude: number; longitude: number; barrier_type: string; description: string | null; status: string; created_at: string }

const locationHints = [
  { name: 'Panjim', detail: '5 demo reports', href: '/map' },
  { name: 'Margao', detail: '4 demo reports', href: '/map' },
  { name: 'Verna', detail: '4 demo reports', href: '/map' },
]

export default function Dashboard() {
  const { session } = useAuth()
  const [myReports, setMyReports] = useState<Report[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      if (!session?.user.id) return
      setLoading(true)
      const [mine, recent] = await Promise.all([
        supabase.from('barrier_reports').select('id, latitude, longitude, barrier_type, description, status, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('barrier_reports').select('id, latitude, longitude, barrier_type, description, status, created_at').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(5),
      ])
      if (!mine.error) setMyReports(mine.data ?? [])
      if (!recent.error) setRecentReports(recent.data ?? [])
      setLoading(false)
    }
    loadDashboard()
  }, [session?.user.id])

  const confirmedMine = myReports.filter((r) => r.status === 'confirmed').length
  const pendingMine = myReports.filter((r) => r.status === 'draft').length
  const displayName = session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? session?.user.email?.split('@')[0] ?? 'there'

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-10 access-enter">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl md:px-10 md:py-10 access-grid">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[55px] border-emerald-400/10 access-float" />
        <div className="absolute bottom-[-120px] right-[18%] h-64 w-64 rounded-full border-[45px] border-sky-400/5" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 access-pulse" /> ACCESSIBILITY INTELLIGENCE
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] md:text-6xl">Make every journey more accessible.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Report barriers. Understand accessibility. When a path is blocked, ACCESS helps you find a safer alternative.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/map" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/20 hover:-translate-y-0.5 hover:bg-emerald-300"><Route size={18} /> Find an accessible route</Link>
              <Link to="/report" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-white hover:bg-white/10"><Plus size={18} /> Report a barrier</Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Route intelligence</span><ShieldCheck size={19} className="text-emerald-300" /></div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-red-300">ROUTE A · 12 MIN</p><p className="mt-1 font-black">Blocked ramp detected</p></div><span className="rounded-full bg-red-400/15 px-2 py-1 text-[10px] font-black text-red-300">HIGH RISK</span></div></div>
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-emerald-300">ROUTE B · 14 MIN</p><p className="mt-1 font-black">Lower reported barrier risk</p></div><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black text-emerald-300">RECOMMENDED</span></div></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-400">Accessibility is a route property — not just a destination property.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3 access-stagger">
        {[
          { label: 'My reports', value: loading ? '—' : myReports.length, note: 'Submitted by you', icon: MapPin },
          { label: 'Confirmed', value: loading ? '—' : confirmedMine, note: 'Published reports', icon: CheckCircle2 },
          { label: 'Awaiting review', value: loading ? '—' : pendingMine, note: 'AI-analyzed drafts', icon: Sparkles },
        ].map((stat) => {
          const Icon = stat.icon
          return <div key={stat.label} className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-500">{stat.label}</p><span className="rounded-xl bg-slate-100 p-2.5 transition group-hover:bg-emerald-50 group-hover:text-emerald-700"><Icon size={18} /></span></div><p className="mt-5 text-3xl font-black tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-slate-500">{stat.note}</p></div>
        })}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Explore</p><h2 className="mt-1 text-2xl font-black tracking-tight">What can you do?</h2></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { href: '/map', title: 'Explore accessibility', text: 'See barriers and accessible locations around you.', icon: Map, tone: 'bg-slate-950 text-white' },
              { href: '/report', title: 'Report a barrier', text: 'Upload evidence and get an AI-assisted assessment.', icon: Plus, tone: 'bg-emerald-500 text-white' },
              { href: '/chat', title: 'Ask ACCESS AI', text: 'Get practical accessibility guidance and map context.', icon: Bot, tone: 'bg-sky-600 text-white' },
              { href: '/map', title: 'Find a safer route', text: 'Compare walking alternatives against reported barriers.', icon: Route, tone: 'bg-amber-500 text-white' },
            ].map((item) => { const Icon = item.icon; return <Link key={item.title} to={item.href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"><div className="flex items-center justify-between"><span className={`rounded-xl p-2.5 ${item.tone}`}><Icon size={19} /></span><ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-950" /></div><h3 className="mt-5 font-black">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p></Link> })}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Demo coverage</p><h2 className="mt-1 text-xl font-black">Goa prototype</h2></div><MapPin className="text-emerald-600" size={20} /></div>
          <p className="mt-2 text-sm leading-6 text-slate-500">13 confirmed prototype reports across three demo locations.</p>
          <div className="mt-5 space-y-2">{locationHints.map((location) => <Link key={location.name} to={location.href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-emerald-50"><span className="font-bold">{location.name}</span><span className="text-xs font-semibold text-slate-500">{location.detail} →</span></Link>)}</div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-black text-emerald-800">PROTOTYPE DATASET</p><p className="mt-1 text-xs leading-5 text-emerald-700">Demo reports are community-style sample data for the hackathon prototype.</p></div>
        </aside>
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Community</p><h2 className="mt-1 text-xl font-black">Recent reports</h2></div><Link to="/map" className="text-sm font-bold text-slate-500 hover:text-slate-950">View map →</Link></div>
        {loading ? <div className="p-6 text-sm text-slate-500">Loading recent reports…</div> : recentReports.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No confirmed reports yet.</div> : <div className="divide-y divide-slate-100">{recentReports.map((report) => <Link key={report.id} to={`/barrier/${report.id}`} className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700"><MapPin size={17} /></span><div className="min-w-0"><p className="truncate font-bold">{report.barrier_type}</p><p className="truncate text-sm text-slate-500">{report.description || 'Community accessibility report'}</p></div></div><ArrowRight size={17} className="shrink-0 text-slate-300 group-hover:translate-x-1 group-hover:text-slate-950" /></Link>)}</div>}
      </section>

      <p className="mt-7 text-center text-xs text-slate-400">Signed in as {displayName} · ACCESS accessibility intelligence</p>
    </main>
  )
}
