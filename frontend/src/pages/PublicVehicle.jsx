import { useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { ArrowLeft, AlertCircle, Car, Calendar, Gauge, Fuel, Settings2, Activity, MapPin, Receipt, BarChart3, TrendingUp } from "lucide-react";
import {
  formatVehicleEnergyType,
  formatGearboxType,
  getOdometerUnit,
  getConsumptionUnit,
  formatExpenseType
} from "../utils/vehicleLabels";

export default function PublicVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [fuelings, setFuelings] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVehicle = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/vehicles/${id}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar la información del vehículo o es privado");
        }
        const data = await response.json();
        setVehicle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadVehicle();
  }, [id]);

  useEffect(() => {
    if (!vehicle) return;

    const loadExtraData = async () => {
      try {
        const promises = [];

        if (vehicle.showFuelData) {
          promises.push(
            apiFetch(`/api/vehicles/${id}/fuelings`)
              .then(res => res.json())
              .then(data => setFuelings(data))
              .catch(() => setFuelings([]))
          );
        }

        if (vehicle.showExpenses) {
          promises.push(
            apiFetch(`/api/vehicles/${id}/expenses`)
              .then(res => res.json())
              .then(data => setExpenses(data))
              .catch(() => setExpenses([]))
          );
        }

        if (vehicle.showStatistics) {
          promises.push(
            apiFetch(`/api/vehicles/${id}/statistics`)
              .then(res => res.json())
              .then(data => setStats(data))
              .catch(() => setStats(null))
          );
        }

        await Promise.allSettled(promises);
      } catch (err) {
        console.error(err);
      }
    };

    loadExtraData();
  }, [vehicle, id]);

  if (loading) {
    return (
      <div className="section-shell py-10 text-slate-100">
        <section className="glass-panel mx-auto max-w-5xl rounded-[2rem] p-8 text-sm text-slate-300">
          Cargando vehículo...
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-6 lg:pb-16">
        <div className="section-shell">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al perfil
              </button>
            </div>

            {error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                {error}
              </div>
            ) : vehicle ? (
              <div className="space-y-6">

                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-teal-900/20 to-transparent pointer-events-none"></div>

                  <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-teal-950 text-teal-400 ring-2 ring-teal-500/20 sm:h-28 sm:w-28">
                        <Car className="h-12 w-12" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-500">Vehículo Público</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                          {vehicle.brand} {vehicle.model}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                            <Calendar className="h-3.5 w-3.5" />
                            {vehicle.year}
                          </span>
                          {vehicle.vehicleEnergyType && (
                            <span className="flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300">
                              <Fuel className="h-3.5 w-3.5" />
                              {formatVehicleEnergyType(vehicle.vehicleEnergyType)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                  <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Especificaciones Técnicas</h2>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <article className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-5 transition hover:border-teal-500/30 hover:bg-slate-900/80">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-teal-400 transition group-hover:bg-teal-950">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">Potencia / Motor</p>
                        <p className="truncate text-base font-semibold text-white">
                          {vehicle.power ? `${vehicle.power} CV` : 'N/D'} {vehicle.cc ? `- ${vehicle.cc} cc` : ''}
                        </p>
                      </div>
                    </article>

                    <article className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-5 transition hover:border-teal-500/30 hover:bg-slate-900/80">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-teal-400 transition group-hover:bg-teal-950">
                        <Settings2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">Caja de cambios</p>
                        <p className="truncate text-base font-semibold text-white">
                          {vehicle.gearbox ? formatGearboxType(vehicle.gearbox) : 'N/D'}
                        </p>
                      </div>
                    </article>

                    <article className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-5 transition hover:border-teal-500/30 hover:bg-slate-900/80">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-teal-400 transition group-hover:bg-teal-950">
                        <Gauge className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">Kilometraje</p>
                        <p className="truncate text-base font-semibold text-white">
                          {vehicle.odometer ? `${vehicle.odometer.toLocaleString("es-ES")} ${getOdometerUnit(vehicle.vehicleType)}` : 'N/D'}
                        </p>
                      </div>
                    </article>

                    <article className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-5 transition hover:border-teal-500/30 hover:bg-slate-900/80">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-teal-400 transition group-hover:bg-teal-950">
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">Capacidad depósito</p>
                        <p className="truncate text-base font-semibold text-white">
                          {vehicle.tankCapacity ? `${vehicle.tankCapacity} L` : 'N/D'}
                        </p>
                      </div>
                    </article>
                  </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  {vehicle.showFuelData && (
                    <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8 h-[400px] flex flex-col">
                      <div className="mb-6 flex items-center justify-between shrink-0">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Últimos Repostajes</h2>
                        <Fuel className="h-5 w-5 text-teal-500/50" />
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {fuelings.length > 0 ? (
                          fuelings.map((fuel) => (
                            <article key={fuel.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4 border border-white/5">
                              <div>
                                <p className="text-sm font-semibold text-white">{fuel.liters} L • {fuel.priceTotal} €</p>
                                <p className="text-xs text-slate-400 mt-1">{fuel.date} • {fuel.distance} km recorridos</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-teal-400">{fuel.boardConsumption ? `${fuel.boardConsumption} L/100` : '---'}</p>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <p className="text-sm text-slate-500">No hay repostajes registrados aún.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {vehicle.showExpenses && (
                    <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8 h-[400px] flex flex-col">
                      <div className="mb-6 flex items-center justify-between shrink-0">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Últimos Gastos</h2>
                        <Receipt className="h-5 w-5 text-teal-500/50" />
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {expenses.length > 0 ? (
                          expenses.map((expense) => (
                            <article key={expense.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4 border border-white/5">
                              <div>
                                <p className="text-sm font-semibold text-white">{formatExpenseType(expense.type)}</p>
                                <p className="text-xs text-slate-400 mt-1">{expense.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-rose-400">{expense.cost} €</p>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <p className="text-sm text-slate-500">No hay gastos registrados aún.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}