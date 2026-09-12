import { useRef, useState } from 'react'
import { Camera, MapPin, Upload, Sparkles, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

type AIResult = {
  barrier_detected: boolean
  barrier_type: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  explanation: string
}

type DraftReport = {
  id: string
  ai_result: AIResult
  barrier_type: string
}

const barrierTypes = [
  'Blocked Ramp',
  'Narrow Pathway',
  'Steep Entrance',
  'Inaccessible Entrance',
  'Missing Accessibility Facility',
  'Accessible Entrance',
  'Accessibility Uncertain',
]

export default function Report() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const [barrierType, setBarrierType] = useState('')
  const [description, setDescription] = useState('')

  const [loadingLocation, setLoadingLocation] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const [draft, setDraft] = useState<DraftReport | null>(null)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)

  function handlePhoto(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be 10 MB or smaller.')
      return
    }

    setError(null)
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setDraft(null)
  }

  function getLocation() {
    setError(null)
    setLoadingLocation(true)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setLoadingLocation(false)
      },
      () => {
        setError(
          'Unable to get your location. Please allow location access and try again.',
        )
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }

  async function analyzeReport() {
    setError(null)

    if (!session?.access_token) {
      setError('You must be signed in.')
      return
    }

    if (!photo) {
      setError('Please upload a photo first.')
      return
    }

    if (!latitude || !longitude) {
      setError('Please add your location first.')
      return
    }

    setAnalyzing(true)

    try {
      const form = new FormData()

      form.append('photo', photo)
      form.append('latitude', latitude)
      form.append('longitude', longitude)
      form.append('description', description)
      form.append('barrier_type', barrierType)

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-report-v5`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: form,
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze report.')
      }

      setDraft({
        id: data.report.id,
        ai_result: data.report.ai_result,
        barrier_type: data.report.barrier_type,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while analyzing the photo.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  async function confirmReport(action: 'confirm' | 'reject') {
    if (!session?.access_token || !draft) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            report_id: draft.id,
            action,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not update report.')
      }

      if (action === 'confirm') {
        navigate(`/barrier/${draft.id}`)
      } else {
        setDraft(null)
        setPhoto(null)
        setPreview(null)
        setBarrierType('')
        setDescription('')
        setLatitude('')
        setLongitude('')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-28 md:px-6 md:pb-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-500">
          REPORT A BARRIER
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Help make places more accessible.
        </h1>

        <p className="mt-2 max-w-2xl text-slate-600">
          Upload a photo, tell us where it is, and ACCESS will
          provide an AI-assisted assessment for you to review.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Photo */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2">
              <Camera size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                1. Add a photo
              </h2>
              <p className="text-sm text-slate-500">
                Show the entrance, pathway, or accessibility barrier.
              </p>
            </div>
          </div>

          {preview ? (
            <div className="relative mt-5 overflow-hidden rounded-2xl">
              <img
                src={preview}
                alt="Selected accessibility report"
                className="max-h-[420px] w-full object-cover"
              />

              <button
                type="button"
                onClick={() => {
                  setPhoto(null)
                  setPreview(null)
                  setDraft(null)
                }}
                className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-lg"
                aria-label="Remove photo"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-500"
            >
              <Upload size={28} />

              <span className="mt-3 font-semibold">
                Upload a photo
              </span>

              <span className="mt-1 text-sm text-slate-500">
                JPEG, PNG, or WebP · max 10 MB
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => handlePhoto(event.target.files?.[0])}
          />
        </section>

        {/* Location */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2">
              <MapPin size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                2. Add the location
              </h2>

              <p className="text-sm text-slate-500">
                We use coordinates to place the report on the map.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={getLocation}
            disabled={loadingLocation}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loadingLocation
              ? 'Getting your location...'
              : 'Use my current location'}
          </button>

          {latitude && longitude && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Location captured: {Number(latitude).toFixed(5)},{' '}
              {Number(longitude).toFixed(5)}
            </div>
          )}
        </section>

        {/* Details */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">
            3. Describe the issue
          </h2>

          <label className="mt-5 block text-sm font-semibold">
            Barrier type
          </label>

          <select
            value={barrierType}
            onChange={(event) => {
              setBarrierType(event.target.value)
              setDraft(null)
            }}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-950"
          >
            <option value="">
              Let AI determine it
            </option>

            {barrierTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <label className="mt-5 block text-sm font-semibold">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setDraft(null)
            }}
            placeholder="What makes this place difficult or easy to access?"
            rows={4}
            maxLength={2000}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
          />
        </section>

        {/* Analyze */}
        {!draft && (
          <button
            type="button"
            onClick={analyzeReport}
            disabled={analyzing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white shadow-lg disabled:opacity-50"
          >
            <Sparkles size={20} />

            {analyzing
              ? 'ACCESS is analyzing the photo...'
              : 'Analyze with ACCESS AI'}
          </button>
        )}

        {/* AI result */}
        {draft && (
          <section className="rounded-3xl border border-slate-300 bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-400">
                  AI-ASSISTED ASSESSMENT
                </p>

                <h2 className="text-xl font-black">
                  Review this result
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <p className="text-sm text-slate-400">
                Detected barrier
              </p>

              <p className="mt-1 text-2xl font-black">
                {draft.ai_result.barrier_type}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  Severity: {draft.ai_result.severity}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1">
                  Confidence:{' '}
                  {Math.round(draft.ai_result.confidence * 100)}%
                </span>
              </div>

              <p className="mt-5 leading-6 text-slate-300">
                {draft.ai_result.explanation}
              </p>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              AI is advisory only. Please review the result before
              publishing this report.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => confirmReport('reject')}
                disabled={saving}
                className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                onClick={() => confirmReport('confirm')}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
              >
                <CheckCircle2 size={19} />

                {saving
                  ? 'Saving...'
                  : 'Confirm & publish'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}