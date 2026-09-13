import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Navigation,
  Route,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Location = [number, number]

type Report = {
  id: string
  latitude: number
  longitude: number
  barrier_type: string
  description: string | null
  created_at: string
}

type RouteOption = {
  coordinates: Location[]
  distance: number
  duration: number
  riskScore: number
  nearbyBarriers: Report[]
}

type Props = {
  userLocation: Location | null
}

const ROUTING_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving'

function haversineMeters(a: Location, b: Location) {
  const R = 6371000
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function minDistanceToRoute(
  report: Report,
  coordinates: Location[],
) {
  const point: Location = [report.latitude, report.longitude]
  let minimum = Number.POSITIVE_INFINITY

  // Full OSRM geometry is dense enough for a fast MVP proximity check.
  for (let index = 0; index < coordinates.length; index += 3) {
    minimum = Math.min(
      minimum,
      haversineMeters(point, coordinates[index]),
    )
  }

  return minimum
}

function barrierWeight(type: string) {
  if (type === 'Blocked Ramp' || type === 'Inaccessible Entrance') {
    return 5
  }

  if (
    type === 'Narrow Pathway' ||
    type === 'Steep Entrance' ||
    type === 'Missing Accessibility Facility'
  ) {
    return 3
  }

  if (type === 'Accessibility Uncertain') {
    return 1
  }

  return 0
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  return `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  return remaining === 0
    ? `${hours} hr`
    : `${hours} hr ${remaining} min`
}

function MapDestinationPicker({
  selecting,
  onPick,
}: {
  selecting: boolean
  onPick: (location: Location) => void
}) {
  useMapEvents({
    click(event) {
      if (selecting) {
        onPick([event.latlng.lat, event.latlng.lng])
      }
    },
  })

  return null
}

export default function AccessibleRoutePlanner({
  userLocation,
}: Props) {
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

    let bestIndex = 0
    let bestScore = Number.POSITIVE_INFINITY

    routes.forEach((route, index) => {
      // Accessibility risk is intentionally weighted much more heavily
      // than a small increase in walking time.
      const score = route.riskScore * 1000 + route.duration / 60

      if (score < bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    return bestIndex
  }, [routes])

  async function calculateRoutes(start: Location, end: Location) {
    setLoading(true)
    setError('')

    try {
      const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`
      const response = await fetch(
        `${ROUTING_URL}/${coordinates}?alternatives=3&steps=true&overview=full&geometries=geojson`,
      )

      if (!response.ok) {
        throw new Error('The walking route service is unavailable right now.')
      }

      const payload = await response.json()
      const rawRoutes = Array.isArray(payload.routes)
        ? payload.routes
        : []

      if (!rawRoutes.length) {
        throw new Error('No walking route could be found between these locations.')
      }

      const allCoordinates = rawRoutes.flatMap(
        (route: any) =>
          route.geometry?.coordinates?.map(
            ([lng, lat]: [number, number]) => [lat, lng] as Location,
          ) ?? [],
      )

      if (!allCoordinates.length) {
        throw new Error('The route service returned no map geometry.')
      }

      const lats = allCoordinates.map(([lat]) => lat)
      const lngs = allCoordinates.map(([, lng]) => lng)
      const padding = 0.002

      const { data: reports, error: reportsError } = await supabase.rpc(
        'get_map_reports',
        {
          p_min_lat: Math.min(...lats) - padding,
          p_max_lat: Math.max(...lats) + padding,
          p_min_lng: Math.min(...lngs) - padding,
          p_max_lng: Math.max(...lngs) + padding,
          p_limit: 500,
        },
      )

      if (reportsError) {
        console.warn('Could not load barrier reports for routing:', reportsError)
      }

      const confirmedReports = (reports ?? []) as Report[]

      const scoredRoutes: RouteOption[] = rawRoutes.map((route: any) => {
        const routeCoordinates =
          route.geometry?.coordinates?.map(
            ([lng, lat]: [number, number]) => [lat, lng] as Location,
          ) ?? []

        const nearbyBarriers = confirmedReports.filter((report) => {
          const distance = minDistanceToRoute(report, routeCoordinates)
          return distance <= 70 && barrierWeight(report.barrier_type) > 0
        })

        const riskScore = nearbyBarriers.reduce((total, report) => {
          const distance = minDistanceToRoute(report, routeCoordinates)
          const weight = barrierWeight(report.barrier_type)

          if (distance <= 30) return total + weight
          return total + weight * 0.5
        }, 0)

        return {
          coordinates: routeCoordinates,
          distance: Number(route.distance ?? 0),
          duration: Number(route.duration ?? 0),
          riskScore,
          nearbyBarriers,
        }
      })

      setRoutes(scoredRoutes)
      setSelectedRoute(0)
      setOpen(true)

      const routeBounds = scoredRoutes[recommendedIndex]?.coordinates
      if (routeBounds?.length) {
        map.fitBounds(routeBounds, {
          padding: [80, 80],
          maxZoom: 17,
        })
      }
    } catch (routeError) {
      console.error('Route calculation failed:', routeError)
      setRoutes([])
      setError(
        routeError instanceof Error
          ? routeError.message
          : 'Could not calculate an accessible route.',
      )
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!destination || !userLocation) return

    calculateRoutes(userLocation, destination)
    // The user intentionally changes destination/location; this effect should
    // only react to those two values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, userLocation])

  useEffect(() => {
    if (!routes.length) return

    const route = routes[selectedRoute]
    if (!route?.coordinates.length) return

    map.fitBounds(route.coordinates, {
      padding: [90, 90],
      maxZoom: 17,
    })
  }, [map, routes, selectedRoute])

  function startPickingDestination() {
    setError('')
    setSelecting(true)
    setOpen(true)
  }

  function pickDestination(location: Location) {
    setDestination(location)
    setSelecting(false)
  }

  function clearRoute() {
    setDestination(null)
    setRoutes([])
    setError('')
    setSelecting(false)
    setOpen(false)
  }

  const selected = routes[selectedRoute]
  const recommended = routes[recommendedIndex]

  return (
    <>
      <MapDestinationPicker
        selecting={selecting}
        onPick={pickDestination}
      />

      {routes.map((route, index) => (
        <Polyline
          key={`route-${index}`}
          positions={route.coordinates}
          pathOptions={{
            color: index === recommendedIndex ? '#16a34a' : '#64748b',
            weight: index === selectedRoute ? 7 : 4,
            opacity: index === recommendedIndex ? 0.95 : 0.45,
            dashArray: index === recommendedIndex ? undefined : '8 8',
          }}
          eventHandlers={{
            click: () => setSelectedRoute(index),
          }}
        />
      ))}

      {destination && (
        <CircleMarker
          center={destination}
          radius={9}
          pathOptions={{
            color: '#020617',
            weight: 3,
            fillColor: '#ffffff',
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Destination</strong>
          </Popup>
        </CircleMarker>
      )}

      <div className="absolute left-4 top-4 z-[1000] w-[min(390px,calc(100vw-32px))]">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-xl transition hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Accessibility size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-slate-950">
                Find an accessible route
              </span>
              <span className="block text-xs text-slate-500">
                Avoid reported accessibility barriers on the way
              </span>
            </span>
          </button>
        )}

        {open && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Route size={18} />
                  <h2 className="text-sm font-black text-slate-950">
                    Accessible route planner
                  </h2>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  We compare walking routes with confirmed ACCESS reports and recommend the route with the lowest reported barrier risk.
                </p>
              </div>

              <button
                type="button"
                onClick={clearRoute}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close route planner"
              >
                <X size={18} />
              </button>
            </div>

            {!userLocation && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <div className="flex gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>Tap the location button on the map first so ACCESS knows where your route starts.</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={startPickingDestination}
              disabled={!userLocation || loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Crosshair size={17} />
              {selecting
                ? 'Tap your destination on the map'
                : destination
                  ? 'Choose a different destination'
                  : 'Choose destination on map'}
            </button>

            {loading && (
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                Finding routes and checking reported barriers…
              </div>
            )}

            {error && !loading && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800">
                {error}
              </div>
            )}

            {selected && !loading && (
              <div className="mt-3 space-y-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-black text-emerald-950">
                        Recommended route
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-800">
                        {recommended?.nearbyBarriers.length
                          ? `${recommended.nearbyBarriers.length} reported barrier${recommended.nearbyBarriers.length === 1 ? '' : 's'} detected nearby. This route has the lowest risk among the available alternatives.`
                          : 'No confirmed accessibility barriers were detected near this route.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Walking time</p>
                    <p className="mt-1 font-black text-slate-950">
                      {formatDuration(selected.duration)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Distance</p>
                    <p className="mt-1 font-black text-slate-950">
                      {formatDistance(selected.distance)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {routes.map((route, index) => (
                    <button
                      type="button"
                      key={`route-card-${index}`}
                      onClick={() => setSelectedRoute(index)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        index === selectedRoute
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black">
                            {index === recommendedIndex
                              ? 'Recommended'
                              : `Alternative ${index}`}
                          </p>
                          <p className="mt-1 text-xs opacity-75">
                            {formatDuration(route.duration)} · {formatDistance(route.distance)}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold">
                          {route.nearbyBarriers.length === 0
                            ? 'No nearby reports'
                            : `${route.nearbyBarriers.length} barrier${route.nearbyBarriers.length === 1 ? '' : 's'}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {selected.nearbyBarriers.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="flex items-center gap-2 text-xs font-black text-amber-950">
                      <AlertTriangle size={15} />
                      Reports near this route
                    </p>
                    <div className="mt-2 space-y-2">
                      {selected.nearbyBarriers.slice(0, 3).map((report) => (
                        <div key={report.id} className="text-xs leading-5 text-amber-900">
                          <strong>{report.barrier_type}</strong>
                          {report.description ? ` — ${report.description}` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] leading-4 text-slate-400">
                  <Navigation size={13} />
                  Route is based on OpenStreetMap walking data. ACCESS reports are community-reported and should be treated as advisory.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
