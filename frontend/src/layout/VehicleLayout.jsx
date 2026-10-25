import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useParams, useLocation } from "react-router-dom";
import { apiFetch } from "../services/api";
import VehicleLoadingSkeleton from "../components/VehicleLoadingSkeleton";
import { ArrowLeft } from "lucide-react";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { formatVehicleEnergyType } from "../utils/vehicleLabels";

export default function VehicleLayout() {
    const { vehicleId } = useParams();
    const { pathname } = useLocation();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const refreshes = useRef(new Map());
    const active = useRef(true);
    const [refreshErrors, setRefreshErrors] = useState({});
    const [refreshingIds, setRefreshingIds] = useState(() => new Set());

    useEffect(() => {
        const controller = new AbortController();
        const loadVehicles = async () => {
            try {
                const response = await apiFetch("/api/vehicles", { signal: controller.signal });

                if (!response.ok) {
                    throw new Error("No se pudieron cargar los vehículos");
                }

                const data = await response.json();
                if (controller.signal.aborted) return;
                setVehicles(data);
            } catch (fetchError) {
                if (controller.signal.aborted || fetchError.name === "AbortError") return;
                setError(fetchError.message || "Error cargando vehículos");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        loadVehicles();
        return () => controller.abort();
    }, []);

    const selectedVehicle = useMemo(
        () => vehicles.find((vehicle) => String(vehicle.id) === String(vehicleId)),
        [vehicles, vehicleId]
    );

    const updateVehicle = useCallback((updatedVehicle) => {
        setVehicles((current) => current.map((vehicle) =>
            vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
        ));
    }, []);
    useEffect(() => {
        active.current = true;
        const requests = refreshes.current;
        return () => {
            active.current = false;
            for (const controller of requests.values()) controller.abort();
            requests.clear();
        };
    }, []);

    const refreshVehicle = useCallback(async (id) => {
        if (!active.current) return;
        refreshes.current.get(id)?.abort();
        const controller = new AbortController();
        refreshes.current.set(id, controller);
        setRefreshingIds((current) => new Set(current).add(id));
        try {
            const response = await apiFetch(`/api/vehicles/${id}`, { signal: controller.signal });
            if (!response.ok) throw new Error("No se pudo actualizar la información del vehículo. Vuelve a intentarlo.");
            const vehicle = await response.json();
            if (controller.signal.aborted) return;
            updateVehicle(vehicle);
            setRefreshErrors((current) => ({ ...current, [id]: "" }));
        } catch (failure) {
            if (!controller.signal.aborted) setRefreshErrors((current) => ({ ...current, [id]: failure.message }));
        } finally {
            if (refreshes.current.get(id) === controller && !controller.signal.aborted) {
                refreshes.current.delete(id);
                setRefreshingIds((current) => { const next = new Set(current); next.delete(id); return next; });
            }
        }
    }, [updateVehicle]);
    const outletContext = useMemo(() => ({ selectedVehicle, updateVehicle, refreshVehicle,
        vehicleRefreshing: refreshingIds.has(selectedVehicle?.id), vehicleRefreshError: refreshErrors[selectedVehicle?.id] || "" }),
        [selectedVehicle, updateVehicle, refreshVehicle, refreshingIds, refreshErrors]);

    const navigationItems = [
        { label: "Resumen", to: "" },
        { label: "Repostajes", to: "fuelings" },
        { label: "Gastos", to: "expenses" },
        { label: "Recordatorios", to: "reminders" },
        { label: "Neumáticos", to: "tires" },
        { label: "Estadísticas", to: "statistics" },
    ];

    return (
        <div className="text-slate-100 fl-route-content" tabIndex={-1} data-route-content={loading || error || !selectedVehicle ? pathname : undefined}>
            <main className="pb-10 lg:pb-16">
                <div className="section-shell space-y-6">
                    {loading || (!error && selectedVehicle) ? (
                    <Surface as="section" className="fl-vehicle-navigation">
                        <header className="fl-vehicle-identity">
                            <div className="min-w-0">
                                <Button asChild variant="link" className="px-0 h-11 focus-visible:transition-none"><Link to="/dashboard"><ArrowLeft aria-hidden="true" />Garaje</Link></Button>
                                <h1 className="fl-page-title break-words">{loading ? <><span className="sr-only">Cargando vehículo</span><span aria-hidden="true" className="block h-8 w-48 rounded-lg bg-secondary" /></> : `${selectedVehicle.brand} ${selectedVehicle.model}`}</h1>
                                {!loading ? <p className="fl-supporting mt-2">{selectedVehicle.year} · {formatVehicleEnergyType(selectedVehicle.vehicleEnergyType)}</p> : null}
                            </div>
                        </header>

                        <nav className="fl-vehicle-tabs" aria-label="Secciones del vehículo">
                            {navigationItems.map((item) => loading ? (
                                <span key={item.label} aria-disabled="true" className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-500 sm:px-4">
                                    {item.label}
                                </span>
                            ) : (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    end={item.to === ""}
                                    className={({ isActive }) =>
                                        [
                                            "fl-vehicle-tab",
                                            isActive
                                                ? "fl-vehicle-tab-active"
                                                : "",
                                        ].join(" ")
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </Surface>
                    ) : null}

                    {refreshErrors[vehicleId] && <Surface role="alert" className="fl-workspace">
                        <p>{refreshErrors[vehicleId]}</p>
                        <Button variant="outline" className="mt-3" onClick={() => refreshVehicle(selectedVehicle.id)}>Actualizar vehículo</Button>
                    </Surface>}
                    {loading ? <VehicleLoadingSkeleton /> : error ? (
                        <Surface role="alert" className="fl-workspace text-destructive">{error}</Surface>
                    ) : !selectedVehicle ? (
                        <Surface className="fl-workspace">
                            <p className="text-lg font-semibold text-white">Vehículo no encontrado</p>
                            <p className="mt-3 text-sm text-slate-300">Vuelve al selector para elegir otro coche.</p>
                            <Button asChild variant="outline" className="mt-6"><Link to="/dashboard">
                                Volver al selector
                            </Link></Button>
                        </Surface>
                    ) : (
                        <Suspense fallback={<VehicleLoadingSkeleton />}>
                            <Outlet key={vehicleId} context={outletContext} />
                        </Suspense>
                    )}
                </div>
            </main>
        </div>
    );
}
