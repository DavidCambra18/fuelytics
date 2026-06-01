import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowRight, CarFront, Fuel, LocateFixed, MapPinned, Search, TriangleAlert } from "lucide-react";

import { apiJson } from "../services/api";

const DEFAULT_CENTER = [40.4168, -3.7038];
const SEARCH_RADIUS_KM = 15;

const FUEL_OPTIONS = [
  { value: "diesel", label: "Diesel" },
  { value: "gasoline95", label: "Gasolina 95" },
  { value: "gasoline98", label: "Gasolina 98" },
];

function normalizeNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getMarkerTone(price, range) {
  if (!Number.isFinite(price) || !range || range.max <= range.min) {
    return "emerald";
  }

  const segment = (range.max - range.min) / 3;

  if (price <= range.min + segment) {
    return "emerald";
  }

  if (price <= range.min + segment * 2) {
    return "amber";
  }

  return "rose";
}

function createStationIcon(tone) {
  const toneStyles = {
    emerald: "background: linear-gradient(180deg, #34d399 0%, #059669 100%); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.35);",
    amber: "background: linear-gradient(180deg, #fbbf24 0%, #f97316 100%); box-shadow: 0 10px 20px rgba(249, 115, 22, 0.35);",
    rose: "background: linear-gradient(180deg, #f87171 0%, #dc2626 100%); box-shadow: 0 10px 20px rgba(220, 38, 38, 0.35);",
  };

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:1.85rem;height:1.85rem;border-radius:9999px;border:2px solid rgba(255,255,255,0.9);${toneStyles[tone]}">
        <div style="width:0.6rem;height:0.6rem;border-radius:9999px;background:rgba(255,255,255,0.95);"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  });
}

function MapViewController({ center }) {
  const map = useMap();

  useEffect(() => {
    map.panTo(center, { animate: true });
  }, [center, map]);

  return null;
}

function MapCenterTracker({ onCenterChange }) {
  const map = useMapEvents({
    moveend: (event) => {
      const nextCenter = event.target.getCenter();
      onCenterChange([nextCenter.lat, nextCenter.lng]);
    },
  });

  return null;
}

function CenterOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[401] flex items-center justify-center">
      <div className="-mt-2 flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-teal-200 bg-teal-400" />
      </div>
    </div>
  );
}

function buildGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

function formatPrice(price) {
  if (!Number.isFinite(price)) {
    return "Sin precio";
  }

  return `${price.toFixed(3)} €`;
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return "Sin distancia";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export default function GasStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fuelType, setFuelType] = useState("diesel");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [updatedAt, setUpdatedAt] = useState("");
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [searchCenter, setSearchCenter] = useState(DEFAULT_CENTER);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(nextLocation);
        setMapCenter([nextLocation.lat, nextLocation.lng]);
        setLocationStatus("ready");
      },
      () => {
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, []);

  useEffect(() => {
    if (!hasSearched) {
      setStations([]);
      setUpdatedAt("");
      return;
    }

    const loadStations = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        params.set("fuelType", fuelType);

        params.set("lat", String(searchCenter[0]));
        params.set("lng", String(searchCenter[1]));
        params.set("radiusKm", String(SEARCH_RADIUS_KM));

        const path = `/api/external/gas-stations?${params.toString()}`;
        console.debug("GasStations: fetching", path);

        // Use apiJson directly to log response details for debugging
        const resp = await apiJson(path).catch((e) => {
          console.error("GasStations: apiJson error:", e);
          throw e;
        });

        console.debug("GasStations: response payload", resp);
        setStations(resp.stations || []);
        setUpdatedAt(resp.updatedAt || "");
      } catch (fetchError) {
        console.error("GasStations: fetch failed", fetchError);
        setError(fetchError.message || "No se pudieron cargar las gasolineras");
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [fuelType, searchCenter, hasSearched]);



  const priceRange = useMemo(() => {
    const prices = stations.map((station) => station.price).filter((price) => Number.isFinite(price));

    if (prices.length === 0) {
      return null;
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [stations]);

  const topStations = useMemo(() => stations.slice(0, 5), [stations]);

  const currentFuel = FUEL_OPTIONS.find((option) => option.value === fuelType)?.label || "Diesel";
  const mapRadiusMeters = SEARCH_RADIUS_KM * 1000;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(nextLocation);
        setMapCenter([nextLocation.lat, nextLocation.lng]);
        setLocationStatus("ready");
      },
      () => {
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  const handleSearch = () => {
    // Create a new array to ensure the state reference changes
    setSearchCenter([mapCenter[0], mapCenter[1]]);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-16 lg:pb-16">
        <div className="section-shell space-y-6">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-teal-100">
                  <MapPinned className="h-3.5 w-3.5" />
                  Gasolineras cercanas
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Compara precios oficiales cerca de ti y decide dónde repostar.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Mueve el centro del mapa donde quieras y pulsa el boton de Buscar ahora, y buscará las gasolineras dentro de un radio fijo de 15 km.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <LocateFixed className="h-4 w-4" />
                  Usar mi ubicación
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-5 py-3 text-sm font-semibold text-teal-50 transition hover:bg-teal-300/20"
                >
                  Volver al dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="glass-panel rounded-3xl p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-200">
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">Combustible</span>
                    <div className="relative">
                      <Fuel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={fuelType}
                        onChange={(event) => setFuelType(event.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/60 px-10 py-3 text-sm text-white outline-none transition focus:border-teal-300/40"
                      >
                        {FUEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="bg-slate-950">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-950 transition ${loading ? 'bg-teal-300/70 cursor-not-allowed opacity-80' : 'bg-teal-400 hover:bg-teal-300'}`}
                  >
                    {loading ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    {loading ? 'Cargando...' : 'Buscar ahora'}
                  </button>
                  <p className="text-sm text-slate-400">
                    {mapCenter ? `Centro actual: ${mapCenter[0].toFixed(4)}, ${mapCenter[1].toFixed(4)}` : "Sin centro definido"}
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Combustible</p>
                    <p className="mt-2 text-lg font-semibold text-white">{currentFuel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Gasolineras</p>
                    <p className="mt-2 text-lg font-semibold text-white">{stations.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Actualizado</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {updatedAt ? new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date(updatedAt)) : "Pendiente"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <CarFront className="h-4 w-4 text-teal-300" />
                  <span>
                    {locationStatus === "ready"
                      ? "Geolocalización activa"
                      : locationStatus === "loading"
                        ? "Solicitando ubicación..."
                        : locationStatus === "denied"
                          ? "Permiso denegado, mueve el mapa y busca la zona manualmente"
                          : locationStatus === "unsupported"
                            ? "Tu navegador no soporta geolocalización"
                            : "Mueve el mapa y pulsa buscar para cargar estaciones cercanas"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Radio fijo: 15 km</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Centro visible del mapa</span>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.7fr_0.9fr]">
              <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/40">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Mapa en vivo</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Precios oficiales por zona</h2>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Verde = barata</p>
                    <p>Naranja = normal</p>
                    <p>Rojo = cara</p>
                  </div>
                </div>

                <div className="relative h-[540px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/30">
                  {loading ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/90 px-5 py-3 text-sm text-slate-200 shadow-2xl">
                        Cargando estaciones...
                      </div>
                    </div>
                  ) : null}

                  <MapContainer center={mapCenter} zoom={location ? 13 : 6} className="h-full w-full" preferCanvas scrollWheelZoom={true}>
                    <MapViewController center={mapCenter} />
                    <MapCenterTracker onCenterChange={setMapCenter} />
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={mapCenter} icon={L.divIcon({ className: "", html: "", iconSize: [0, 0], iconAnchor: [0, 0] })} interactive={false} />

                    <Circle center={searchCenter} radius={mapRadiusMeters} pathOptions={{ color: "#2dd4bf", fillColor: "#2dd4bf", fillOpacity: 0.08 }} />

                    {stations.map((station) => (
                      <Marker
                        key={station.id}
                        position={[station.latitude, station.longitude]}
                        icon={createStationIcon(getMarkerTone(station.price, priceRange))}
                      >
                        <Popup>
                          <div className="space-y-3 text-slate-900">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{station.fuelLabel}</p>
                              <h3 className="mt-1 text-base font-semibold text-slate-900">{station.name}</h3>
                              <p className="text-sm text-slate-600">{station.brand}</p>
                            </div>
                            <div className="space-y-1 text-sm text-slate-700">
                              <p>{station.address}</p>
                              <p>{station.municipality} · {station.province}</p>
                              <p>Precio: <strong>{formatPrice(station.price)}</strong></p>
                              <p>Distancia: <strong>{formatDistance(station.distanceKm)}</strong></p>
                            </div>
                            <a
                              href={buildGoogleMapsUrl(station.latitude, station.longitude)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Cómo llegar
                              <ArrowRight className="h-4 w-4" />
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                  <CenterOverlay />
                </div>
              </section>

              <aside className="space-y-4">
                <section className="glass-panel rounded-[1.75rem] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Más baratas</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">Top 5 dentro de 15 km</h2>
                    </div>
                    <TriangleAlert className="h-5 w-5 text-amber-300" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {topStations.length === 0 ? (
                      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                        Aún no hay estaciones cargadas. Mueve el mapa al punto deseado y espera un instante.
                      </p>
                    ) : (
                      topStations.map((station, index) => (
                        <article key={station.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-teal-300/20 hover:bg-white/[0.05]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-300/10 text-xs font-semibold text-teal-100">
                                  {index + 1}
                                </span>
                                <h3 className="text-base font-semibold text-white">{station.name}</h3>
                              </div>
                              <p className="mt-1 text-sm text-slate-400">{station.municipality} · {station.province}</p>
                            </div>
                            <p className="text-right text-base font-semibold text-white">{formatPrice(station.price)}</p>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                            <span>{formatDistance(station.distanceKm)}</span>
                            <a href={buildGoogleMapsUrl(station.latitude, station.longitude)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-200 transition hover:text-teal-100">
                              Cómo llegar
                              <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}