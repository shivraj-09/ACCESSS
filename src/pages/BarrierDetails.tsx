import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Sparkles, AlertTriangle, ShieldCheck, Navigation, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MapView from '../components/MapView'

type AIResult = { barrier_detected: boolean; barrier_type: string; severity: 'low' | 'medium' | 'high'; confidence: number; explanation: string }
type Report = { id: string; latitude: number; longitude: number; barrier_type: string; description: string | null; photo_url: string | null; ai_result: AIResult | null; status: string; created_at: string }

export default function BarrierDetails() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      if (!id) { setError('Report ID is missing.'); setLoading(false); return }
      const { data, error } = await supabase.from('barrier_reports').select('id, latitude, longitude, barrier_type, description, photo_url, ai_result, status, created_at').eq('id', id).single()
      if (error) { console.error(error); setError('Could not load this report.'); setLoading(false); return }
      setReport(data)
      if (data.photo_url) {
        const { data: signedData, error: signedError } = await supabase.storage.from('barrier-photos').createSignedUrl(data.photo_url, 60 * 60)
        if (!signedError) setPhotoUrl(signedData.signedUrl)
      }
      setLoading(false)
    }
    void loadReport()
  }, [id])

  if (loading) return <main className="flex min-h-[70vh] items-center justify-center"><div className="access-pulse rounded-full bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">Loading accessibility report…</div></main>
  if (error || !report) return <main className="mx-auto max-w-3xl px-4 py-10 access-enter"><Link to="/map" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft size={18} /> Back to map</Link><div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">{error ?? 'Report not found.'}</div></main>

  const ai = report.ai_result
  const confidence = ai ? Math.round(ai.confidence * 100) : null
  const severity = ai?.severity ?? 'low'
  const severityLabel = severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low'
  const formattedDate = new Date(report.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-6 md:py-9 md:pb-10 access-enter">
      <Link to="/map" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:-translate-x-0.5 hover:text-slate-950"><ArrowLeft size={18} /> Back to accessibility map</Link>

      <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl md:p-8 access-grid">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[42px] border-emerald-400/10 access-float" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-300"><CheckCircle2 size={14} /> Confirmed community report</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{report.barrier_type}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><Calendar size={15} /> {formattedDate}</span><span className="inline-flex items-center gap-2"><MapPin size={15} /> {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span></div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><p className="text-xs font-black uppercase tracking-widest text-slate-500">ACCESS signal</p><p className="mt-1 flex items-center gap-2 font-black text-emerald-300"><ShieldCheck size={17} /> Confirmed</p></div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
          {photoUrl ? <div className="group relative overflow-hidden bg-slate-100"><img src={photoUrl} alt={`Evidence for ${report.barrier_type}`} className="max-h-[620px] w-full object-cover transition duration-700 group-hover:scale-[1.015]" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 to-transparent p-5 pt-16"><span className="text-xs font-bold text-white">Evidence submitted with this report</span></div></div> : <div className="flex h-72 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">No photo available</div>}
          {report.description && <div className="p-6"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Reporter observation</p><p className="mt-2 text-base leading-7 text-slate-700">{report.description}</p></div>}
        </section>

        <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-xl md:p-7">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-400/15 p-2.5 text-emerald-300"><Sparkles size={20} /></span><div><p className="text-xs font-black uppercase tracking-widest text-emerald-300">AI-assisted assessment</p><h2 className="mt-1 text-xl font-black">What ACCESS detected</h2></div></div>
          {ai ? <>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Barrier type</p><p className="mt-1 text-2xl font-black">{ai.barrier_type}</p><div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${severity === 'high' ? 'bg-red-400/15 text-red-300' : severity === 'medium' ? 'bg-amber-400/15 text-amber-200' : 'bg-emerald-400/15 text-emerald-300'}`}>Severity · {severityLabel}</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">Confidence · {confidence}%</span></div></div>
            <div className="mt-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">AI explanation</p><p className="mt-2 text-sm leading-7 text-slate-300">{ai.explanation}</p></div>
            <div className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" /><p className="text-xs leading-5 text-slate-400">AI analysis is advisory. The submitting user reviewed and confirmed this report before publication.</p></div>
          </> : <p className="mt-6 text-slate-400">No AI analysis is available for this report.</p>}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 md:p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><Navigation size={19} /></span><div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Location context</p><h2 className="font-black">See it on the map</h2></div></div><span className="hidden text-xs font-semibold text-slate-400 sm:block">Reported coordinates</span></div>
        <div className="h-[380px]"><MapView focusLocation={{ latitude: report.latitude, longitude: report.longitude }} focusReportId={report.id} /></div>
      </section>
    </main>
  )
}
