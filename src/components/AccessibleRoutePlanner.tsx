import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet'
import { Accessibility, AlertTriangle, CheckCircle2, Crosshair, Navigation, Route, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Location = [number, number]
type Report = { id: string; latitude: number; longitude: number; barrier_type: string; description: string | null; created_at: string }
type RouteOption = { coordinates: Location[]; distance: number; duration: number; riskScore: number; nearbyBarriers: Report[] }
type Props = { userLocation: Location | null }

const ROUTING_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving'

function haversineMeters(a: Location, b: Location) {
  const R = 6371000
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function minDistanceToRoute(report: Report, coordinates: Location[]) {
  const point: Location = [report.latitude, report.longitude]
  let minimum = Number.POSITIVE_INFINITY
  for (let index = 0; index < coordinates.length; index += 3) minimum = Math.min(minimum, haversineMeters(point, coordinates[index]))
  return minimum
}

function barrierWeight(type: string) {
  if (type === 'Blocked Ramp' || type === 'Inaccessible Entrance') return 5
  if (type === 'Narrow Pathway' || type === 'Steep Entrance' || type === 'Missing Accessibility Facility') return 3
  if (type === 'Accessibility Uncertain') return 1
  return 0
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`
}

function DestinationPicker({ selecting, onPick }: { selecting: boolean; onPick: (location: Location) => void }) {
  useMapEvents({ click(event) { if (selecting) onPick([event.latlng.lat, event.latlng.lng]) } })
  return null
}

export default function AccessibleRoutePlanner({ userLocation }: Props) {
  const map = useMap()
  const [selecting, setSelecting] = useState(false)
  const [destination, setDestination] = useState<Location | null>(null)
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [open, setOpen] = useState(false)

  const recommendedIndex = useMemo(() => {
    if (!routes.length) return 0
    return routes.reduce((best, route, index) => {
      const score = route.riskScore * 1000 + route.duration / 60
      const bestScore = routes[best].riskScore * 1000 + routes[best].duration / 60
      return score < bestScore ? index : best
    }, 0)
  }, [routes])

  async function calculateRoutes(start: Location, end: Location) {
    setLoading(true)
    setError('')
    try {
      const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`
      const response = await fetch(`${ROUTING_URL}/${coordinates}?alternatives=3&steps=true&overview=full&geometries=geojson`)
      if (!response.ok) throw new Error('The walking route service is unavailable right now.')
      const payload: unknown = await response.json()
      const rawRoutes = (payload as { routes?: unknown[] }).routes ?? []
      if (!rawRoutes.length) throw new Error('No walking route could be found between these locations.')

      const allCoordinates: Location[] = rawRoutes.flatMap((route) => {
        const geometry = (route as { geometry?: { coordinates?: unknown[] } }).geometry
        return (geometry?.coordinates ?? []).flatMap((pair) => {
          if (!Array.isArray(pair) || pair.length < 2) return []
          const lng = Number(pair[0])
          const lat = Number(pair[1])
          return Number.isFinite(lat) && Number.isFinite(lng) ? [[lat, lng] as Location] : []
        })
      })
      if (!allCoordinates.length) throw new Error('The route service returned no map geometry.')

      const lats = allCoordinates.map(([lat]: Location) => lat)
      const lngs = allCoordinates.map(([, lng]: Location) => lng)
      const padding = 0.002
      const { data: reports, error: reportsError } = await supabase.rpc('get_map_reports', {
        p_min_lat: Math.min(...lats) - padding,
        p_max_lat: Math.max(...lats) + padding,
        p_min_lng: Math.min(...lngs) - padding,
        p_max_lng: Math.max(...lngs) + padding,
        p_limit: 500,
      })
      if (reportsError) console.warn('Could not load barrier reports for routing:', reportsError)
      const confirmedReports = (reports ?? []) as Report[]

      const scoredRoutes: RouteOption[] = rawRoutes.map((rawRoute) => {
        const typedRoute = rawRoute as { geometry?: { coordinates?: unknown[] }; distance?: number; duration?: number }
        const routeCoordinates: Location[] = (typedRoute.geometry?.coordinates ?? []).flatMap((pair) => {
          if (!Array.isArray(pair) || pair.length < 2) return []
          const lng = Number(pair[0])
          const lat = Number(pair[1])
          return Number.isFinite(lat) && Number.isFinite(lng) ? [[lat, lng] as Location] : []
        })
        const nearbyBarriers = confirmedReports.filter((report) => minDistanceToRoute(report, routeCoordinates) <= 70 && barrierWeight(report.barrier_type) > 0)
        const riskScore = nearbyBarriers.reduce((total, report) => {
          const weight = barrierWeight(report.barrier_type)
          return total + (minDistanceToRoute(report, routeCoordinates) <= 30 ? weight : weight * 0.5)
        }, 0)
        return { coordinates: routeCoordinates, distance: Number(typedRoute.distance ?? 0), duration: Number(typedRoute.duration ?? 0), riskScore, nearbyBarriers }
      })

      setRoutes(scoredRoutes)
      setSelectedRoute(0)
      setOpen(true)
      const best = scoredRoutes.reduce((index, route, index2) => {
        const score = route.riskScore * 1000 + route.duration / 60
        const bestScore = scoredRoutes[index].riskScore * 1000 + scoredRoutes[index].duration / 60
        return score < bestScore ? index2 : index
      }, 0)
      if (scoredRoutes[best]?.coordinates.length) map.fitBounds(scoredRoutes[best].coordinates, { padding: [80, 80], maxZoom: 17 })
    } catch (routeError) {
      console.error('Route calculation failed:', routeError)
      setRoutes([])
      setError(routeError instanceof Error ? routeError.message : 'Could not calculate an accessible route.')
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (destination && userLocation) void calculateRoutes(userLocation, destination)
  }, [destination, userLocation])

  useEffect(() => {
    const route = routes[selectedRoute]
    if (route?.coordinates.length) map.fitBounds(route.coordinates, { padding: [90, 90], maxZoom: 17 })
  }, [map, routes, selectedRoute])

  function clearRoute() {
    setDestination(null)
    setRoutes([])
    setError('')
    setSelecting(false)
    setOpen(false)
  }

  const selected = routes[selectedRoute]
  const recommended = routes[recommendedIndex]

  return <>
    <DestinationPicker selecting={selecting} onPick={(location) => { setDestination(location); setSelecting(false) }} />
    {routes.map((route, index) => <Polyline key={`route-${index}`} positions={route.coordinates} pathOptions={{ color: index === recommendedIndex ? '#16a34a' : '#64748b', weight: index === selectedRoute ? 7 : 4, opacity: index === recommendedIndex ? 0.95 : 0.45, dashArray: index === recommendedIndex ? undefined : '8 8' }} eventHandlers={{ click: () => setSelectedRoute(index) }} />)}
    {destination && <CircleMarker center={destination} radius={9} pathOptions={{ color: '#020617', weight: 3, fillColor: '#fff', fillOpacity: 1 }}><Popup><strong>Destination</strong></Popup></CircleMarker>}
    <div className="absolute left-4 top-4 z-[1000] w-[min(390px,calc(100vw-32px))]">
      {!open && <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-xl hover:bg-slate-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><Accessibility size={20} /></span><span><span className="block text-sm font-black text-slate-950">Find an accessible route</span><span className="block text-xs text-slate-500">Avoid reported accessibility barriers on the way</span></span></button>}
      {open && <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Route size={18} /><h2 className="text-sm font-black text-slate-950">Accessible route planner</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">Compare walking routes with confirmed ACCESS reports and recommend the lowest-risk option.</p></div><button type="button" onClick={clearRoute} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close route planner"><X size={18} /></button></div>
        {!userLocation && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><div className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>Tap the location button on the map first so ACCESS knows where your route starts.</span></div></div>}
        <button type="button" onClick={() => { setSelecting(true); setOpen(true) }} disabled={!userLocation || loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Crosshair size={17} />{selecting ? 'Tap your destination on the map' : destination ? 'Choose a different destination' : 'Choose destination on map'}</button>
        {loading && <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Finding routes and checking reported barriers…</div>}
        {error && !loading && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {selected && !loading && <div className="mt-3 space-y-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"><div className="flex items-start gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-sm font-black text-emerald-950">Recommended route</p><p className="mt-1 text-xs leading-5 text-emerald-800">{recommended?.nearbyBarriers.length ? `${recommended.nearbyBarriers.length} reported barrier${recommended.nearbyBarriers.length === 1 ? '' : 's'} nearby. This route has the lowest reported barrier risk.` : 'No confirmed accessibility barriers were detected near this route.'}</p></div></div></div>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Walking time</p><p className="mt-1 font-black text-slate-950">{formatDuration(selected.duration)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Distance</p><p className="mt-1 font-black text-slate-950">{formatDistance(selected.distance)}</p></div></div>
          <div className="space-y-2">{routes.map((route, index) => <button type="button" key={`route-card-${index}`} onClick={() => setSelectedRoute(index)} className={`w-full rounded-2xl border p-3 text-left ${index === selectedRoute ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black">{index === recommendedIndex ? 'Recommended' : `Alternative ${index}`}</p><p className="mt-1 text-xs opacity-75">{formatDuration(route.duration)} · {formatDistance(route.distance)}</p></div><span className="text-[11px] font-bold">{route.nearbyBarriers.length === 0 ? 'No nearby reports' : `${route.nearbyBarriers.length} barrier${route.nearbyBarriers.length === 1 ? '' : 's'}`}</span></div></button>)}</div>
          {selected.nearbyBarriers.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3"><p className="flex items-center gap-2 text-xs font-black text-amber-950"><AlertTriangle size={15} />Reports near this route</p><div className="mt-2 space-y-2">{selected.nearbyBarriers.slice(0, 3).map((report) => <div key={report.id} className="text-xs leading-5 text-amber-900"><strong>{report.barrier_type}</strong>{report.description ? ` — ${report.description}` : ''}</div>)}</div></div>}
          <div className="flex items-center gap-2 text-[11px] leading-4 text-slate-400"><Navigation size={13} />Route uses OpenStreetMap walking data. Community reports are advisory.</div>
        </div>}
      </div>}
    </div>
  </>
}
