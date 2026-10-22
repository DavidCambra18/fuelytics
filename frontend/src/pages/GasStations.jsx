import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowRight, CarFront, Fuel, LocateFixed, MapPin, Navigation, Search, SlidersHorizontal } from "lucide-react";
import "./GasStations.css";

import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import CustomSelect from "../components/CustomSelect";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { mapFlightOptions, scrollBehavior } from "../utils/motion";
import { apiJson } from "../services/api";

const DEFAULT_CENTER = [40.4168, -3.7038];
const SEARCH_RADIUS_KM = 15;

const USER_LOCATION_ICON = L.divIcon({
  className: "",
  html: `
    <div class="user-location-marker" aria-hidden="true">
      <span></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const FUEL_OPTIONS = [
  { value: "diesel", label: "Diésel" },
  { value: "dieselPremium", label: "Diésel premium" },
  { value: "gasoline95", label: "Gasolina 95" },
  { value: "gasoline98", label: "Gasolina 98" },
  { value: "glp", label: "GLP" },
  { value: "gnc", label: "GNC" },
  { value: "gnl", label: "GNL" },
  { value: "biodiesel", label: "Biodiésel" },
  { value: "bioethanol", label: "Bioetanol" },
];

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

function createStationIcon(tone, price) {
  const toneStyles = {
    emerald: "background: linear-gradient(180deg, #34d399 0%, #059669 100%); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.35);",
    amber: "background: linear-gradient(180deg, #fbbf24 0%, #f97316 100%); box-shadow: 0 10px 20px rgba(249, 115, 22, 0.35);",
    rose: "background: linear-gradient(180deg, #f87171 0%, #dc2626 100%); box-shadow: 0 10px 20px rgba(220, 38, 38, 0.35);",
  };
  const priceLabel = Number.isFinite(price)
    ? `${price.toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`
    : "Sin precio";
  const width = Number.isFinite(price) ? 64 : 76;

  return L.divIcon({
    className: "",
    html: `
      <div aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:${width}px;height:30px;border-radius:10px;border:2px solid rgba(255,255,255,0.94);color:#fff;font-family:inherit;font-size:11px;font-weight:800;line-height:1;white-space:nowrap;${toneStyles[tone]}">
        ${priceLabel}
      </div>
    `,
    iconSize: [width, 30],
    iconAnchor: [width / 2, 15],
    popupAnchor: [0, -14],
  });
}

function createClusterIcon(cluster, tone) {
  const toneStyles = {
    emerald: "background: linear-gradient(145deg, #34d399 0%, #047857 100%); box-shadow: 0 12px 26px rgba(16, 185, 129, 0.4);",
    amber: "background: linear-gradient(145deg, #fbbf24 0%, #ea580c 100%); box-shadow: 0 12px 26px rgba(249, 115, 22, 0.4);",
    rose: "background: linear-gradient(145deg, #fb7185 0%, #be123c 100%); box-shadow: 0 12px 26px rgba(225, 29, 72, 0.4);",
  };
  const minimumPrice = Number.isFinite(cluster.minimumPrice)
    ? cluster.minimumPrice.toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    : null;
  const width = cluster.stations.length >= 100 ? 70 : 64;

  return L.divIcon({
    className: "",
    html: `
      <div aria-hidden="true" style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:${width}px;height:50px;border-radius:18px;border:3px solid rgba(255,255,255,0.94);color:#fff;font-family:inherit;line-height:1;${toneStyles[tone]}">
        <strong style="font-size:15px;font-weight:800;letter-spacing:-0.02em;">${cluster.stations.length}</strong>
        <span style="margin-top:4px;font-size:9px;font-weight:700;white-space:nowrap;opacity:0.95;">${minimumPrice ? `desde ${minimumPrice} €` : "sin precio"}</span>
      </div>
    `,
    iconSize: [width, 50],
    iconAnchor: [width / 2, 25],
  });
}

function buildStationClusters(stations, map, zoom) {
  const clusterRadius = zoom <= 8 ? 68 : zoom <= 11 ? 56 : 44;
  const clusters = [];

  stations.forEach((station) => {
    if (!Number.isFinite(station.latitude) || !Number.isFinite(station.longitude)) {
      return;
    }

    const point = map.project([station.latitude, station.longitude], zoom);
    let closestCluster = null;
    let closestDistance = clusterRadius;

    if (zoom < 16) {
      clusters.forEach((cluster) => {
        const distance = point.distanceTo(cluster.point);
        if (distance < closestDistance) {
          closestCluster = cluster;
          closestDistance = distance;
        }
      });
    }

    if (!closestCluster) {
      clusters.push({
        point,
        latitude: station.latitude,
        longitude: station.longitude,
        stations: [station],
      });
      return;
    }

    const previousCount = closestCluster.stations.length;
    const nextCount = previousCount + 1;
    closestCluster.point = L.point(
      ((closestCluster.point.x * previousCount) + point.x) / nextCount,
      ((closestCluster.point.y * previousCount) + point.y) / nextCount,
    );
    closestCluster.latitude = ((closestCluster.latitude * previousCount) + station.latitude) / nextCount;
    closestCluster.longitude = ((closestCluster.longitude * previousCount) + station.longitude) / nextCount;
    closestCluster.stations.push(station);
  });

  return clusters.map((cluster) => {
    const prices = cluster.stations
      .map((station) => station.price)
      .filter((price) => Number.isFinite(price));

    return {
      ...cluster,
      averagePrice: prices.length > 0 ? prices.reduce((total, price) => total + price, 0) / prices.length : null,
      minimumPrice: prices.length > 0 ? Math.min(...prices) : null,
    };
  });
}

function StationPopup({ station, tone }) {
  const priceTone = {
    emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-300/20 bg-amber-400/10 text-amber-200",
    rose: "border-rose-300/20 bg-rose-400/10 text-rose-200",
  }[tone];
  const showBrand = station.brand
    && station.brand.trim().toLocaleLowerCase("es-ES") !== station.name.trim().toLocaleLowerCase("es-ES");

  return (
    <Popup
      className="fuelytics-station-popup"
      maxWidth={300}
      minWidth={230}
    >
      <article className="fl-station-popup-content">
        <header className="fl-station-popup-header">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <Fuel className="h-3 w-3" aria-hidden="true" />
            {station.fuelLabel}
          </div>
          <h3 className="mt-3 break-words text-lg font-semibold leading-tight text-foreground">{station.name}</h3>
          {showBrand ? <p className="mt-1 text-sm text-muted-foreground">{station.brand}</p> : null}
        </header>

        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-teal-200">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 text-sm leading-5">
              <p className="break-words font-medium text-foreground">{station.address}</p>
              <p className="mt-1 text-muted-foreground">{station.municipality} · {station.province}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-2xl border p-3 ${priceTone}`}>
              <p className="text-xs font-medium">Precio</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-current">{formatPrice(station.price)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-foreground">
              <p className="text-xs font-medium text-muted-foreground">
                {station.distanceFromUser ? "Desde ti" : "Distancia"}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{formatDistance(station.distanceKm)}</p>
            </div>
          </div>

          <Button asChild className="w-full"><a
            href={buildGoogleMapsUrl(station.latitude, station.longitude)}
            target="_blank"
            rel="noreferrer"
            className="station-popup-route"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Cómo llegar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a></Button>
        </div>
      </article>
    </Popup>
  );
}

function StationMarker({ station, priceRange, selected, onSelect, onPopupOpen, onPopupClose }) {
  const markerRef = useRef(null);
  const stationTone = getMarkerTone(station.price, priceRange);

  useEffect(() => {
    if (selected) {
      markerRef.current?.openPopup();
    }
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      position={[station.latitude, station.longitude]}
      icon={createStationIcon(stationTone, station.price)}
      title={`${station.name}: ${formatPrice(station.price)}`}
      eventHandlers={{
        click: () => onSelect(station.id),
        popupopen: () => onPopupOpen(station.id),
        popupclose: () => onPopupClose(station.id),
      }}
      zIndexOffset={selected ? 500 : 0}
    >
      <StationPopup station={station} tone={stationTone} />
    </Marker>
  );
}

function ClusteredStationMarkers({
  stations,
  priceRange,
  selectedStationId,
  onSelectStation,
  onStationPopupOpen,
  onStationPopupClose,
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend: (event) => setZoom(event.target.getZoom()),
  });

  const clusters = useMemo(
    () => buildStationClusters(stations, map, zoom),
    [map, stations, zoom],
  );

  return clusters.map((cluster) => {
    if (cluster.stations.length === 1) {
      const station = cluster.stations[0];
      return (
        <StationMarker
          key={station.id}
          station={station}
          priceRange={priceRange}
          selected={station.id === selectedStationId}
          onSelect={onSelectStation}
          onPopupOpen={onStationPopupOpen}
          onPopupClose={onStationPopupClose}
        />
      );
    }

    const position = [cluster.latitude, cluster.longitude];
    const clusterKey = `${cluster.stations[0].id}-${cluster.stations.length}-${position[0].toFixed(5)}-${position[1].toFixed(5)}`;
    const clusterTone = getMarkerTone(cluster.averagePrice, priceRange);

    return (
      <Marker
        key={clusterKey}
        position={position}
        icon={createClusterIcon(cluster, clusterTone)}
        title={`${cluster.stations.length} gasolineras; precio mínimo ${formatPrice(cluster.minimumPrice)}`}
        eventHandlers={{
          click: () => {
            let targetZoom = Math.min(zoom + 1, 17);

            while (
              targetZoom < 17
              && buildStationClusters(cluster.stations, map, targetZoom).length === 1
            ) {
              targetZoom += 1;
            }

            map.flyTo(position, targetZoom, mapFlightOptions(0.45));
          },
        }}
      />
    );
  });
}

function SelectedStationController({ station }) {
  const map = useMap();

  useEffect(() => {
    if (!station) return;

    map.flyTo(
      [station.latitude, station.longitude],
      Math.max(map.getZoom(), 16),
      mapFlightOptions(0.5),
    );
  }, [map, station]);

  return null;
}

function MapMotionPreference() {
  const map = useMap();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Stop an in-flight camera movement without starting another flight.
    if (reducedMotion) map.stop();
  }, [map, reducedMotion]);

  return null;
}

function MapSizeSync() {
  const map = useMap();
  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [map]);
  return null;
}

function MapCenterTracker({ onCenterChange }) {
  useMapEvents({
    moveend: (event) => {
      const nextCenter = event.target.getCenter();
      onCenterChange([nextCenter.lat, nextCenter.lng]);
    },
  });

  return null;
}

function UserLocationMarker({ location }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(
      [location.lat, location.lng],
      Math.max(map.getZoom(), 13),
      mapFlightOptions(0.5),
    );
  }, [location, map]);

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={USER_LOCATION_ICON}
      title="Tu ubicación"
      zIndexOffset={1000}
      keyboard={false}
    />
  );
}

function MapLocationControl({ location, loading, popupOpen, onRequestLocation }) {
  const map = useMap();

  const handleClick = (event) => {
    event.stopPropagation();

    if (location) {
      map.flyTo(
        [location.lat, location.lng],
        Math.max(map.getZoom(), 15),
        mapFlightOptions(0.5),
      );
      return;
    }

    onRequestLocation();
  };

  return (
    <div className={`leaflet-top leaflet-right ${popupOpen ? "hidden sm:block" : ""}`}>
      <div className="leaflet-control m-3">
        <Button
          type="button"
          onClick={handleClick}
          disabled={loading}
          variant="outline" size="icon" className="map-location-control"
          aria-label={location ? "Ir a mi ubicación" : "Obtener mi ubicación"}
          title={location ? "Ir a mi ubicación" : "Obtener mi ubicación"}
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}

function MapSearchControl({ loading, onSearch }) {
  return (
    <div className="leaflet-bottom leaflet-left w-full">
      <div
        className="leaflet-control !mb-10 flex w-full justify-center px-4 lg:!mb-5"
        style={{ marginLeft: 0, marginRight: 0 }}
      >
        <Button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSearch();
          }}
          disabled={loading}
          variant="secondary" className="map-search-control"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4 text-teal-300" aria-hidden="true" />
          )}
          {loading ? "Buscando..." : "Buscar en esta zona"}
        </Button>
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

  return `${price.toLocaleString("es-ES", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} €`;
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return "Sin distancia";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

function calculateDistanceKm(origin, latitude, longitude) {
  if (!origin || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = ((latitude - origin.lat) * Math.PI) / 180;
  const longitudeDelta = ((longitude - origin.lng) * Math.PI) / 180;
  const originLatitude = (origin.lat * Math.PI) / 180;
  const destinationLatitude = (latitude * Math.PI) / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const normalizedHaversine = Math.min(1, haversine);

  return earthRadiusKm * 2 * Math.atan2(
    Math.sqrt(normalizedHaversine),
    Math.sqrt(1 - normalizedHaversine),
  );
}

export default function GasStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fuelType, setFuelType] = useState("diesel");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(() => navigator.geolocation ? "loading" : "unsupported");
  const [updatedAt, setUpdatedAt] = useState("");
  const [sourceState, setSourceState] = useState("idle");
  const [sourceError, setSourceError] = useState("");
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [searchCenter, setSearchCenter] = useState(DEFAULT_CENTER);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortMode, setSortMode] = useState("price");
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [openStationPopupId, setOpenStationPopupId] = useState(null);
  const selectedCardRef = useRef(null);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    if (selectedStationId && window.matchMedia("(min-width: 1024px)").matches) {
      selectedCardRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
    }
  }, [selectedStationId]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

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
      (locationError) => {
        setLocationStatus(locationError.code === locationError.PERMISSION_DENIED ? "denied" : "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );

    return undefined;
  }, []);

  useEffect(() => {
    if (!hasSearched) return undefined;

    const controller = new AbortController();
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
        const resp = await apiJson(path, { signal: controller.signal });
        setStations(resp.stations || []);
        setUpdatedAt(resp.updatedAt || "");
        setSourceState(resp.sourceReady ? "ready" : (resp.stations || []).length > 0 ? "stale" : "unavailable");
        setSourceError(resp.sourceError || "");
      } catch (fetchError) {
        if (fetchError.name === "AbortError") return;
        setError(fetchError.message || "No se pudieron cargar las gasolineras");
      } finally {
        setLoading(false);
      }
    };

    loadStations();
    return () => controller.abort();
  }, [fuelType, searchCenter, hasSearched]);

  const displayedStations = useMemo(() => {
    if (!location) {
      return stations;
    }

    return stations.map((station) => ({
      ...station,
      distanceKm: calculateDistanceKm(location, station.latitude, station.longitude),
      distanceFromUser: true,
    }));
  }, [location, stations]);

  const sortedStations = useMemo(() => [...displayedStations].sort((firstStation, secondStation) => {
    const firstPrice = Number.isFinite(firstStation.price) ? firstStation.price : Number.POSITIVE_INFINITY;
    const secondPrice = Number.isFinite(secondStation.price) ? secondStation.price : Number.POSITIVE_INFINITY;
    const firstDistance = Number.isFinite(firstStation.distanceKm)
      ? firstStation.distanceKm
      : Number.POSITIVE_INFINITY;
    const secondDistance = Number.isFinite(secondStation.distanceKm)
      ? secondStation.distanceKm
      : Number.POSITIVE_INFINITY;

    if (sortMode === "distance" && firstDistance !== secondDistance) {
      return firstDistance - secondDistance;
    }

    if (firstPrice !== secondPrice) {
      return firstPrice - secondPrice;
    }

    return firstDistance === secondDistance ? 0 : firstDistance - secondDistance;
  }), [displayedStations, sortMode]);

  const priceRange = useMemo(() => {
    const prices = displayedStations.map((station) => station.price).filter((price) => Number.isFinite(price));

    if (prices.length === 0) {
      return null;
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [displayedStations]);

  const selectedStation = useMemo(
    () => displayedStations.find((station) => station.id === selectedStationId) || null,
    [displayedStations, selectedStationId],
  );

  const handleUseCurrentLocation = () => {
    if (location) {
      setMapCenter([location.lat, location.lng]);
      return;
    }

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
      (locationError) => {
        setLocationStatus(locationError.code === locationError.PERMISSION_DENIED ? "denied" : "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  const handleSearch = () => {
    setSelectedStationId(null);
    setOpenStationPopupId(null);
    setSearchCenter([mapCenter[0], mapCenter[1]]);
    setHasSearched(true);
  };

  const handleSelectStationFromList = (stationId) => {
    setSelectedStationId(stationId);

    if (!window.matchMedia("(min-width: 1024px)").matches) {
      mapSectionRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }
  };

  return (
    <div className="gas-stations-page fl-gas-page text-foreground">
      <main className="gas-stations-main fl-gas-main">
        <div className="fl-gas-shell">
          <Surface as="section" className="fl-gas-workspace">
            <header className="fl-gas-header">
              <div className="fl-gas-heading">
                <div className="min-w-0"><h1>Gasolineras</h1><p>Explora el mapa, compara precios y calcula la distancia desde tu ubicación.</p></div>
                <Button asChild variant="outline" className="gas-stations-dashboard-link"><Link to="/dashboard">Garaje<ArrowRight aria-hidden="true" /></Link></Button>
              </div>
              <div className="gas-stations-controls fl-gas-controls">
                <div className="fl-field-group"><label className="fl-label" htmlFor="station-fuel-type">Combustible</label>
                  <CustomSelect appearance="atlantic" id="station-fuel-type" options={FUEL_OPTIONS} value={fuelType} onChange={(value) => setFuelType(value)} />
                </div>
                <div className="fl-location-status" role="status" aria-live="polite">
                  <CarFront className="h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
                  <span className="min-w-0">
                    {locationStatus === "ready"
                      ? "Distancias calculadas desde tu ubicación"
                      : locationStatus === "loading"
                        ? "Solicitando tu ubicación..."
                        : locationStatus === "denied"
                          ? "Permiso de ubicación denegado"
                          : locationStatus === "unsupported"
                            ? "Geolocalización no disponible"
                            : "Distancias provisionales desde el centro del mapa"}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="fl-header-search"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" aria-hidden="true" />
                  ) : (
                    <Search className="h-4 w-4" aria-hidden="true" />
                  )}
                  {loading ? "Buscando..." : "Buscar en esta zona"}
                </Button>
              </div>

              {error || sourceState === "stale" || sourceState === "unavailable" ? (
                <div
                  role={error || sourceState === "unavailable" ? "alert" : "status"}
                  className={`mt-3 rounded-xl border px-4 py-2.5 text-sm ${
                    error || sourceState === "unavailable"
                      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-100"
                  }`}
                >
                  {error || (sourceState === "unavailable"
                    ? "La fuente de precios no está disponible en este momento."
                    : "Se muestran los últimos datos disponibles.")}
                  {sourceError ? ` ${sourceError}` : ""}
                </div>
              ) : null}
            </header>

            <div className="gas-stations-results-layout fl-gas-results-layout">
              <aside className="fl-gas-results" aria-label="Resultados de gasolineras">
                <div className="fl-gas-results-header">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Resultados</h2>
                      <p className="fl-supporting mt-1">
                        {hasSearched ? `${sortedStations.length} gasolineras en esta zona` : "Prepara tu búsqueda en el mapa"}
                      </p>
                    </div>
                    {updatedAt ? (
                      <span className="text-right text-xs leading-4 text-muted-foreground">
                        Actualizado<br />
                        {new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date(updatedAt))}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <div className="fl-gas-sort" role="group" aria-label="Ordenar gasolineras">
                      <Button
                        type="button"
                        onClick={() => setSortMode("price")}
                        variant={sortMode === "price" ? "secondary" : "ghost"} aria-pressed={sortMode === "price"} className="fl-gas-sort-button"
                      >
                        Más baratas
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setSortMode("distance")}
                        variant={sortMode === "distance" ? "secondary" : "ghost"} aria-pressed={sortMode === "distance"} className="fl-gas-sort-button"
                      >
                        Más cercanas
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="fl-station-results">
                  {sortedStations.length === 0 ? (
                    <div className="fl-station-empty" role="status">
                      <Search className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                      <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                        {loading
                          ? "Buscando gasolineras..."
                          : hasSearched
                            ? "No hay gasolineras con precio en esta zona"
                            : "Mueve el mapa y busca para comparar precios"}
                      </p>
                    </div>
                  ) : (
                    sortedStations.map((station, index) => {
                      const selected = station.id === selectedStationId;
                      const tone = getMarkerTone(station.price, priceRange);
                      const toneClass = {
                        emerald: "bg-emerald-400",
                        amber: "bg-amber-400",
                        rose: "bg-rose-400",
                      }[tone];

                      return (
                        <article
                          key={station.id}
                          ref={selected ? selectedCardRef : null}
                          className="fl-station-card" data-selected={selected}
                        >
                          <Button type="button" onClick={() => handleSelectStationFromList(station.id)} aria-pressed={selected} variant="ghost" className="fl-station-select">
                            <div className="flex items-start gap-3">
                              <span className="fl-station-rank">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="fl-station-name">{station.name}</h3>
                                    <p className="fl-station-town">{station.municipality} · {station.province}</p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="fl-station-price">{formatPrice(station.price)}</p>
                                    <span className={`mt-1 inline-block h-1.5 w-8 rounded-full ${toneClass}`} aria-hidden="true" />
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                    <Navigation className="h-3.5 w-3.5 text-blue-300" aria-hidden="true" />
                                    {location ? "Desde ti: " : ""}{formatDistance(station.distanceKm)}
                                  </span>
                                  <span className="font-medium text-primary">Ver en mapa</span>
                                </div>
                              </div>
                            </div>
                          </Button>
                        </article>
                      );
                    })
                  )}
                </div>
              </aside>

              <section ref={mapSectionRef} className="fl-gas-map" aria-label="Mapa de gasolineras">
                <div className="fl-map-legend">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Barata
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Normal
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> Cara
                </div>

                {loading ? (
                  <div className="absolute inset-0 z-[700] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]" role="status" aria-live="polite">
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/90 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" aria-hidden="true" />
                      Actualizando precios
                    </div>
                  </div>
                ) : null}

                <MapContainer center={mapCenter} zoom={location ? 13 : 6} className="absolute inset-0 h-full w-full" preferCanvas scrollWheelZoom={true}>
                  <MapMotionPreference />
                  <MapSizeSync />
                  <MapCenterTracker onCenterChange={setMapCenter} />
                  <SelectedStationController station={selectedStation} />
                  <MapLocationControl
                    location={location}
                    loading={locationStatus === "loading"}
                    popupOpen={openStationPopupId !== null}
                    onRequestLocation={handleUseCurrentLocation}
                  />
                  <MapSearchControl loading={loading} onSearch={handleSearch} />
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {location ? <UserLocationMarker location={location} /> : null}
                  <ClusteredStationMarkers
                    stations={displayedStations}
                    priceRange={priceRange}
                    selectedStationId={selectedStationId}
                    onSelectStation={setSelectedStationId}
                    onStationPopupOpen={setOpenStationPopupId}
                    onStationPopupClose={(stationId) => {
                      setOpenStationPopupId((currentStationId) => (
                        currentStationId === stationId ? null : currentStationId
                      ));
                    }}
                  />
                </MapContainer>

              </section>
            </div>
          </Surface>
        </div>
      </main>
    </div>
  );
}
