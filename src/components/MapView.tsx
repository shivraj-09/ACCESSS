import { useCallback, useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AccessibleRoutePlanner from './AccessibleRoutePlanner'
import 'leaflet/dist/leaflet.css'

type Report = { id: string; latitude: number; longitude: number; barrier_type: string; description: string | null; created_at: string }
type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number }
type FocusLocation = { latitude: number; longitude: number }
type MapViewProps = { focusLocation?: FocusLocation; focusReportId?: string }
const defaultCenter: [number, number] = [15.4909, 73.8278]

function createIcon(type: string) {
  let symbol = '•'
  if (type === 'Blocked Ramp') symbol = '!'
  if (type === 'Accessible Entrance') symbol = '✓'
  if (type === 'Accessibility Uncertain') symbol = '?'
  if (type === 'Narrow Pathway') symbol = '↔'
  if (type === 'Steep Entrance') symbol = '↗'
  if (type === 'Inaccessible Entrance') symbol = '×'
  if (type === 'Missing Accessibility Facility') symbol = '＋'
  return L.divIcon({ className: '', html: `<div style="width:36px;height:36px;border-radius:50%;background:#020617;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.28);font-size:15px">${symbol}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] })
}

function createFocusIcon() {
  return L.divIcon({ className: '', html: `<div style="width:44px;height:44px;border-radius:50%;background:#020617;border:4px solid white;box-shadow:0 5px 20px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:900">!</div>`, iconSize: [44, 44], iconAnchor: [22, 22] })
}

function createUserIcon() {
  return L.divIcon({ className: '', html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3)"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] })
}

function MapEvents({ onBoundsChange }: { onBoundsChange: (bounds: Bounds) => void }) {
  const map = useMapEvents({
    moveend() {
      const bounds = map.getBounds()
      onBoundsChange({ minLat: bounds.getSouth(), maxLat: bounds.getNorth(), minLng: bounds.getWest(), maxLng: bounds.getEast() })
    },
  })
  useEffect(() => {
    const bounds = map.getBounds()
    onBoundsChange({ minLat: bounds.getSouth(), maxLat: bounds.getNorth(), minLng: bounds.getWest(), maxLng: bounds.getEast() })
  }, [map, onBoundsChange])
  return null
}

function MapController({ focusLocation, userLocation }: { focusLocation?: FocusLocation; userLocation: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (focusLocation) map.setView([focusLocation.latitude, focusLocation.longitude], 16, { animate: false })
  }, [focusLocation, map])
  useEffect(() => {
    if (userLocation) map.flyTo(userLocation, 16, { duration: 1 })
  }, [map, userLocation])
  return null
}

export default function MapView({ focusLocation, focusReportId }: MapViewProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const center: [number, number] = focusLocation ? [focusLocation.latitude, focusLocation.longitude] : defaultCenter
  const initialZoom = focusLocation ? 16 : 13

  const loadReports = useCallback(async (bounds: Bounds) => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_map_reports', { p_min_lat: bounds.minLat, p_max_lat: bounds.maxLat, p_min_lng: bounds.minLng, p_max_lng: bounds.maxLng, p_limit: 500 })
    if (error) {
      console.error('Failed to load map reports:', error)
      setReports([])
    } else {
      setReports(data ?? [])
    }
    setLoading(false)
  }, [])

  function locateUser() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setLocating(false)
      },
      (error) => {
        console.error('Location error:', error.message)
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const visibleReports = reports.filter((report) => report.id !== focusReportId)

  return (
    <div className="relative h-full min-h-[350px] w-full overflow-hidden">
      <MapContainer center={center} zoom={initialZoom} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onBoundsChange={loadReports} />
        <MapController focusLocation={focusLocation} userLocation={userLocation} />

        {visibleReports.map((report) => (
          <Marker key={report.id} position={[report.latitude, report.longitude]} icon={createIcon(report.barrier_type)}>
            <Popup>
              <div className="min-w-[190px]">
                <p className="text-xs font-semibold uppercase text-slate-500">ACCESS report</p>
                <h3 className="mt-1 font-bold text-slate-950">{report.barrier_type}</h3>
                {report.description && <p className="mt-2 text-sm leading-5 text-slate-600">{report.description}</p>}
                <Link to={`/barrier/${report.id}`} className="mt-3 inline-block text-sm font-bold text-slate-950">View report →</Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {focusLocation && (
          <Marker position={[focusLocation.latitude, focusLocation.longitude]} icon={createFocusIcon()}>
            <Popup><div className="min-w-[180px]"><p className="text-xs font-semibold uppercase text-slate-500">Current report</p><p className="mt-1 font-bold">Accessibility report location</p></div></Popup>
          </Marker>
        )}

        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()}>
            <Popup><p className="font-semibold">Your current location</p></Popup>
          </Marker>
        )}

        {!focusLocation && <AccessibleRoutePlanner userLocation={userLocation} />}
      </MapContainer>

      {!focusLocation && (
        <div className="absolute left-4 top-4 z-[1000] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2"><MapPin size={17} /><p className="text-sm font-bold">Accessibility Map</p></div>
          <p className="mt-1 text-xs text-slate-500">{loading ? 'Loading reports...' : `${visibleReports.length} confirmed report${visibleReports.length === 1 ? '' : 's'} in this area`}</p>
        </div>
      )}

      {!focusLocation && (
        <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
          <button type="button" onClick={locateUser} disabled={locating} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg transition hover:bg-slate-50 disabled:opacity-60" aria-label="Find my location" title="Find my location">
            <LocateFixed size={20} className={locating ? 'animate-pulse' : ''} />
          </button>
          <button type="button" onClick={() => window.location.reload()} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg transition hover:bg-slate-50" aria-label="Refresh map" title="Refresh map">
            <RefreshCw size={19} />
          </button>
        </div>
      )}

      {!focusLocation && (
        <div className="absolute bottom-6 left-4 z-[1000] hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:block">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Map legend</p>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 font-bold text-white">!</span>Barrier</div>
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 font-bold text-white">✓</span>Accessible</div>
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 font-bold text-white">?</span>Uncertain</div>
          </div>
        </div>
      )}

      {focusLocation && loading && <div className="absolute left-4 top-4 z-[1000] rounded-xl bg-white px-4 py-2 text-xs font-semibold shadow-lg">Loading nearby reports...</div>}
    </div>
  )
}
