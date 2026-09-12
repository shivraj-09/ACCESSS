import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Map,
  MapPin,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type Report = {
  id: string
  latitude: number
  longitude: number
  barrier_type: string
  description: string | null
  status: string
  created_at: string
}

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
        supabase
          .from('barrier_reports')
          .select(
            'id, latitude, longitude, barrier_type, description, status, created_at',
          )
          .eq('user_id', session.user.id)
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('barrier_reports')
          .select(
            'id, latitude, longitude, barrier_type, description, status, created_at',
          )
          .eq('status', 'confirmed')
          .order('created_at', {
            ascending: false,
          })
          .limit(5),
      ])

      if (!mine.error) {
        setMyReports(mine.data ?? [])
      }

      if (!recent.error) {
        setRecentReports(recent.data ?? [])
      }

      setLoading(false)
    }

    loadDashboard()
  }, [session?.user.id])

  const confirmedMine = myReports.filter(
    (report) => report.status === 'confirmed',
  ).length

  const pendingMine = myReports.filter(
    (report) => report.status === 'draft',
  ).length

  const displayName =
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.name ??
    session?.user.email?.split('@')[0] ??
    'there'

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-28 md:px-6 md:pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
            Welcome to ACCESS
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Make accessibility visible.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            Report barriers, discover accessibility conditions,
            and help build a more informed map of the places around
            you.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-slate-100"
            >
              <Plus size={19} />
              Report a barrier
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              <Map size={18} />
              Explore the map
            </Link>
          </div>
        </div>

        {/* Decorative element */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[40px] border-white/5" />

        <div className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full border-[50px] border-white/[0.03]" />
      </section>

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              My reports
            </p>

            <div className="rounded-xl bg-slate-100 p-2">
              <MapPin size={18} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '—' : myReports.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Reports you've submitted
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Confirmed
            </p>

            <div className="rounded-xl bg-slate-100 p-2">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '—' : confirmedMine}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Published accessibility reports
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Awaiting review
            </p>

            <div className="rounded-xl bg-slate-100 p-2">
              <Sparkles size={18} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '—' : pendingMine}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            AI-analyzed drafts
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick actions
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              What would you like to do?
            </h2>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Link
            to="/report"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                <Plus size={20} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950"
              />
            </div>

            <h3 className="mt-5 font-bold text-slate-950">
              Report a barrier
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Upload a photo and let ACCESS help analyze the
              situation.
            </p>
          </Link>

          <Link
            to="/map"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-950">
                <Map size={20} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950"
              />
            </div>

            <h3 className="mt-5 font-bold text-slate-950">
              Explore accessibility
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              See confirmed accessibility reports on the map.
            </p>
          </Link>

          <Link
            to="/chat"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-950">
                <Bot size={20} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950"
              />
            </div>

            <h3 className="mt-5 font-bold text-slate-950">
              Ask ACCESS AI
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Get practical answers about accessibility and barriers.
            </p>
          </Link>
        </div>
      </section>

      {/* Recent community reports */}
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Community
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Recent reports
            </h2>
          </div>

          <Link
            to="/map"
            className="hidden items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-950 sm:flex"
          >
            View map
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading recent reports...
            </div>
          ) : recentReports.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-700">
                No confirmed reports yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Be the first person to make accessibility visible.
              </p>

              <Link
                to="/report"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Create report
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  to={`/barrier/${report.id}`}
                  className="group flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                      <MapPin size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-950">
                        {report.barrier_type}
                      </h3>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {report.description ||
                          'Accessibility report submitted by the community'}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    size={18}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mission */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Why ACCESS exists
        </p>

        <p className="mt-3 max-w-3xl text-xl font-bold leading-8 tracking-tight text-slate-950 md:text-2xl">
          Accessibility should be something people can discover
          before they arrive — not something they have to discover
          the hard way.
        </p>
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">
        Signed in as {displayName}
      </p>
    </main>
  )
}