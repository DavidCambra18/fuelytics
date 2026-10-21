import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PageTransition from "../components/PageTransition";
import VehicleLoadingSkeleton from "../components/VehicleLoadingSkeleton";
import { ArrowLeft } from "lucide-react";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { formatVehicleEnergyType } from "../utils/vehicleLabels";

export default function VehicleLayout() {
    const { vehicleId } = useParams();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const reducedMotion = useReducedMotion();

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

    const updateVehicle = (updatedVehicle) => {
        setVehicles((current) => current.map((vehicle) =>
            vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
        ));
    };

    const navigationItems = [
        { label: "Resumen", to: "" },
        { label: "Repostajes", to: "fuelings" },
        { label: "Gastos", to: "expenses" },
        { label: "Neumáticos", to: "tires" },
        { label: "Estadísticas", to: "statistics" },
    ];

    const view = loading ? "loading" : error ? "error" : selectedVehicle ? "content" : "not-found";

    return (
        <PageTransition>
        <div className="text-slate-100">
            <main className="pb-10 lg:pb-16">
                <div className="section-shell space-y-6">
                    {loading || (!error && selectedVehicle) ? (
                    <Surface as="section" className="fl-vehicle-navigation">
                        <header className="fl-vehicle-identity">
                            <div className="min-w-0">
                                <Button asChild variant="link" className="px-0 h-11 focus-visible:transition-none"><Link to="/dashboard"><ArrowLeft aria-hidden="true" />Garaje</Link></Button>
                                {loading ? <div aria-hidden="true" className="h-8 w-48 rounded-lg bg-secondary" /> : <>
                                    <h1 className="fl-page-title break-words">{selectedVehicle.brand} {selectedVehicle.model}</h1>
                                    <p className="fl-supporting mt-2">{selectedVehicle.year} · {formatVehicleEnergyType(selectedVehicle.vehicleEnergyType)}</p>
                                </>}
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

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={view}
                            initial={{ opacity: reducedMotion ? 1 : 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: reducedMotion ? 1 : 0, transition: { duration: reducedMotion ? 0 : 0.1 } }}
                            transition={{ duration: reducedMotion ? 0 : 0.2 }}
                        >
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
                                    <Outlet context={{ selectedVehicle, updateVehicle }} />
                                </Suspense>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
        </PageTransition>
    );
}
