import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatVehicleType } from "../utils/vehicleLabels";

export default function VehicleLayout() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { username, clearAuth } = useAuth();
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    clearAuth();
    navigate("/login");
  };

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
      <aside className="glass-panel fixed left-0 top-0 z-20 flex h-screen w-full flex-col border-r border-white/10 bg-slate-950/85 p-5 backdrop-blur-xl sm:w-[320px] sm:p-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/15 text-lg font-semibold text-teal-200 ring-1 ring-teal-300/20">
            {(username || "U").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Usuario</p>
            <p className="mt-1 text-base font-semibold text-white">{username || "Usuario"}</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Coche activo</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {selectedVehicle.brand} {selectedVehicle.model}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {formatVehicleType(selectedVehicle.vehicleType)} · {selectedVehicle.year} · {selectedVehicle.power} CV · {selectedVehicle.cc} cc
          </p>
        </div>

        <nav className="mt-5 space-y-3">
          {navigationItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === ""}
              className={({ isActive }) =>
                [
                  "block rounded-2xl border px-4 py-3 transition",
                  isActive
                    ? "border-teal-300/30 bg-teal-300/10"
                    : "border-white/10 bg-white/5 hover:border-teal-300/30 hover:bg-white/10",
                ].join(" ")
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.label === "Resumen" ? "Vista principal del coche" : `${item.label} del vehículo`}
                  </p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <Link
            to="edit"
            className="block rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm font-medium text-blue-50 transition hover:bg-blue-400/15"
          >
            Editar detalles
          </Link>
          <Link
            to="/vehicles/new"
            className="block rounded-2xl border border-teal-300/20 bg-teal-300/10 px-4 py-3 text-sm font-medium text-teal-50 transition hover:bg-teal-300/15"
          >
            Crear coche
          </Link>
          <Link
            to="/dashboard"
            className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Cambiar coche
          </Link>
          <button
            onClick={logout}
            className="w-full rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/15"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="pb-10 pt-6 sm:pt-8 lg:pb-16 lg:pl-[320px]">
        <div className="section-shell space-y-6">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Vehículo seleccionado</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Desde aquí puedes navegar por la información de este coche concreto sin mezclarla con otros vehículos.
                </p>
              </div>
            </div>
          </section>

          <Outlet context={{ selectedVehicle }} />
        </div>
      </main>
    </div>
  );
}
