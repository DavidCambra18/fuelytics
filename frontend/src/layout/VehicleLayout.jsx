import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PageTransition from "../components/PageTransition";
import VehicleLoadingSkeleton from "../components/VehicleLoadingSkeleton";

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
        <div className="min-h-screen text-slate-100 pt-12">
            <main className="pb-10 pt-6 sm:pt-8 lg:pb-16">
                <div className="section-shell space-y-6">
                    {loading || (!error && selectedVehicle) ? (
                    <section className="glass-panel rounded-[1.5rem] p-3 sm:rounded-[2rem] sm:p-4">

                        <nav className="flex items-center gap-1 overflow-x-auto border-b border-white/10 sm:gap-2" aria-label="Secciones del vehículo">
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
                                            "shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4",
                                            isActive
                                                ? "border-teal-300 text-white"
                                                : "border-transparent text-slate-400 hover:text-white",
                                        ].join(" ")
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </section>
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
                                <div role="alert" className="glass-panel rounded-[2rem] p-8 text-sm text-red-300">{error}</div>
                            ) : !selectedVehicle ? (
                                <div className="glass-panel rounded-[2rem] p-8">
                                    <p className="text-lg font-semibold text-white">Vehículo no encontrado</p>
                                    <p className="mt-3 text-sm text-slate-300">Vuelve al selector para elegir otro coche.</p>
                                    <Link to="/dashboard" className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                                        Volver al selector
                                    </Link>
                                </div>
                            ) : (
                                <Suspense fallback={<VehicleLoadingSkeleton />}>
                                    <Outlet context={{ selectedVehicle }} />
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
