import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";

export default function VehicleLayout() {
    const { vehicleId } = useParams();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch("http://localhost:8080/api/vehicles", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("No se pudieron cargar los vehículos");
                }

                const data = await response.json();
                setVehicles(data);
            } catch (fetchError) {
                setError(fetchError.message || "Error cargando vehículos");
            } finally {
                setLoading(false);
            }
        };

        loadVehicles();
    }, []);

    const selectedVehicle = useMemo(
        () => vehicles.find((vehicle) => String(vehicle.id) === String(vehicleId)),
        [vehicles, vehicleId]
    );

    const navigationItems = [
        { label: "Resumen", to: "" },
        { label: "Repostajes", to: "fuelings" },
        { label: "Gastos", to: "expenses" },
        { label: "Estadísticas", to: "statistics" },
    ];

    if (loading) {
        return (
            <div className="section-shell py-12 text-slate-100">
                <div className="glass-panel rounded-[2rem] p-8 text-sm text-slate-300">Cargando vehículo...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="section-shell py-12 text-slate-100">
                <div className="glass-panel rounded-[2rem] p-8 text-sm text-red-300">{error}</div>
            </div>
        );
    }

    if (!selectedVehicle) {
        return (
            <div className="section-shell py-12 text-slate-100">
                <div className="glass-panel rounded-[2rem] p-8">
                    <p className="text-lg font-semibold text-white">Vehículo no encontrado</p>
                    <p className="mt-3 text-sm text-slate-300">Vuelve al selector para elegir otro coche.</p>
                    <Link
                        to="/dashboard"
                        className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950"
                    >
                        Volver al selector
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-100">
            <main className="pb-10 pt-6 sm:pt-8 lg:pb-16">
                <div className="section-shell space-y-6">
                    <section className="glass-panel rounded-[2rem] p-6 sm:p-3">

                        <nav className="mt-2 flex gap-2 border-b border-white/10 items-center">
                            {navigationItems.map((item) => (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    end={item.to === ""}
                                    className={({ isActive }) =>
                                        [
                                            "px-4 py-3 text-sm font-medium transition border-b-2",
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

                    <Outlet context={{ selectedVehicle }} />
                </div>
            </main>
        </div>
    );
}