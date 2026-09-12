import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MapView from '../components/MapView'

type AIResult = {
  barrier_detected: boolean
  barrier_type: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  explanation: string
}

type Report = {
  id: string
  latitude: number
  longitude: number
  barrier_type: string
  description: string | null
  photo_url: string | null
  ai_result: AIResult | null
  status: string
  created_at: string
}

export default function BarrierDetails() {
  const { id } = useParams<{ id: string }>()

  const [report, setReport] = useState<Report | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      if (!id) {
        setError('Report ID is missing.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('barrier_reports')
        .select(
          'id, latitude, longitude, barrier_type, description, photo_url, ai_result, status, created_at',
        )
        .eq('id', id)
        .single()

      if (error) {
        console.error(error)
        setError('Could not load this report.')
        setLoading(false)
        return
      }

      setReport(data)

      if (data.photo_url) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from('barrier-photos')
            .createSignedUrl(data.photo_url, 60 * 60)

        if (!signedError) {
          setPhotoUrl(signedData.signedUrl)
        }
      }

      setLoading(false)
    }

    loadReport()
  }, [id])

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <p className="text-slate-500">Loading report...</p>
      </main>
    )
  }

  if (error || !report) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/map"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft size={18} />
          Back to map
        </Link>

        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error ?? 'Report not found.'}
        </div>
      </main>
    )
  }

  const ai = report.ai_result

  const severityLabel =
    ai?.severity === 'high'
      ? 'High'
      : ai?.severity === 'medium'
        ? 'Medium'
        : 'Low'

  const confidence = ai
    ? Math.round(ai.confidence * 100)
    : null

  const formattedDate = new Date(
    report.created_at,
  ).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-28 md:px-6 md:pb-10">
      {/* Back */}
      <Link
        to="/map"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft size={18} />
        Back to accessibility map
      </Link>

      {/* Header */}
      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Accessibility report
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {report.barrier_type}
        </h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={16} />
            {formattedDate}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MapPin size={16} />
            {report.latitude.toFixed(5)},{' '}
            {report.longitude.toFixed(5)}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Evidence */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Evidence for ${report.barrier_type}`}
              className="max-h-[600px] w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-slate-100 text-slate-500">
              No photo available
            </div>
          )}

          {report.description && (
            <div className="p-6">
              <p className="text-sm font-semibold text-slate-500">
                Reporter description
              </p>

              <p className="mt-2 leading-7 text-slate-700">
                {report.description}
              </p>
            </div>
          )}
        </section>

        {/* AI assessment */}
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5">
              <Sparkles size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AI-assisted assessment
              </p>

              <h2 className="mt-1 text-xl font-black">
                What ACCESS detected
              </h2>
            </div>
          </div>

          {ai ? (
            <>
              <div className="mt-7">
                <p className="text-sm text-slate-400">
                  Barrier type
                </p>

                <p className="mt-1 text-2xl font-black">
                  {ai.barrier_type}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-slate-400">
                    Severity
                  </p>

                  <p className="mt-1 font-bold">
                    {severityLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-slate-400">
                    Confidence
                  </p>

                  <p className="mt-1 font-bold">
                    {confidence}%
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-300">
                  Explanation
                </p>

                <p className="mt-2 leading-7 text-slate-300">
                  {ai.explanation}
                </p>
              </div>

              <div className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <AlertTriangle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-sm leading-6 text-slate-400">
                  AI analysis is advisory. This report was reviewed
                  and confirmed by the person who submitted it.
                </p>
              </div>
            </>
          ) : (
            <p className="mt-6 text-slate-400">
              No AI analysis is available for this report.
            </p>
          )}
        </section>
      </div>

      {/* Location */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2">
              <MapPin size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                Report location
              </h2>

              <p className="text-sm text-slate-500">
                Where this accessibility condition was reported.
              </p>
            </div>
          </div>
        </div>

        <div className="h-[350px]">
          <MapView
            focusLocation={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            focusReportId={report.id}
          />
        </div>
      </section>
    </main>
  )
}