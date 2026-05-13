import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
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

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-20 lg:pb-16">
        <div className="section-shell">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Selecciona un coche</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Elige el vehículo sobre el que quieres trabajar</h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                    Después de elegirlo podrás entrar en sus repostajes, gastos y estadísticas específicas.
                  </p>
                </div>
              </div>

              <Link
                to="/vehicles/new"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/10"
              >
                Crear coche
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Vehículos registrados</p>
                  <p className="mt-2 text-xl font-semibold text-white">Garaje Personal</p>
                </div>
              </div>

              {loading ? (
                <p className="py-8 text-sm text-slate-400">Cargando vehículos...</p>
              ) : error ? (
                <p className="py-8 text-sm text-red-300">{error}</p>
              ) : vehicles.length === 0 ? (
                <div className="py-8">
                  <p className="max-w-2xl text-sm leading-6 text-slate-300">
                    No hay vehículos registrados todavía. Crea tu primer coche para empezar a usar la plataforma.
                  </p>

                  <Link
                    to="/vehicles/new"
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/10"
                  >
                    Registrar primer coche
                  </Link>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {vehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      to={`/vehicles/${vehicle.id}`}
                      className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-teal-300/30 hover:bg-white/[0.05]"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <span className="rounded-full bg-teal-300/10 px-3 py-1 text-xs font-medium text-teal-100">
                            {vehicle.year}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {vehicle.power} CV · {vehicle.cc} cc
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
