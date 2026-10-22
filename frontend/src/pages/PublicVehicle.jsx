import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { ArrowLeft, AlertCircle, LockKeyhole, Car, Calendar, Gauge, Fuel, Settings2, Activity, Receipt, BarChart3 } from "lucide-react";
import {
  formatVehicleEnergyType,
  formatGearboxType,
  getOdometerUnit,
  getConsumptionUnit,
  getQuantityUnitForFuel,
  formatExpenseType
} from "../utils/vehicleLabels";

export default function PublicVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [fuelings, setFuelings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [extraLoading, setExtraLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadVehicle = async () => {
      setLoading(true);
      setError("");
      setVehicle(null);
      setFuelings([]);
      setExpenses([]);
      setStats(null);
      setExtraLoading(true);
      try {
        const response = await apiFetch(`/api/vehicles/${id}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("No se pudo cargar la información del vehículo o es privado");
        }
        const data = await response.json();
        if (!controller.signal.aborted) setVehicle(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadVehicle();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!vehicle || String(vehicle.id) !== id) return;
    const controller = new AbortController();

    const loadExtraData = async () => {
      try {
        const promises = [];

        const loadResource = async (path, setter, emptyValue) => {
          try {
            const response = await apiFetch(path, { signal: controller.signal });
            if (!response.ok) throw new Error("No se pudo cargar la información pública");
            const resource = await response.json();
            if (!controller.signal.aborted) setter(resource);
          } catch {
            if (!controller.signal.aborted) setter(emptyValue);
          }
        };

        if (vehicle.showFuelData) {
          promises.push(loadResource(`/api/vehicles/${id}/fuelings`, setFuelings, []));
        }

        if (vehicle.showExpenses) {
          promises.push(loadResource(`/api/vehicles/${id}/expenses`, setExpenses, []));
        }

        if (vehicle.showStatistics) {
          promises.push(loadResource(`/api/vehicles/${id}/statistics`, setStats, null));
        }

        await Promise.allSettled(promises);
      } catch (err) {
        console.error(err);
      } finally {
        if (!controller.signal.aborted) setExtraLoading(false);
      }
    };

    loadExtraData();
    return () => controller.abort();
  }, [vehicle, id]);

  if (loading) {
    return (
      <div className="public-app-loading section-shell py-10 text-slate-100">
        <Surface as="section" role="status" aria-live="polite" className="fl-workspace fl-community-state mx-auto max-w-5xl">
          Cargando vehículo...
        </Surface>
      </div>
    );
  }

  return (
    <div className="public-app-page fl-public-page fl-profile-page min-h-screen text-foreground">
      <main className="pb-10 pt-6 lg:pb-16">
        <div className="section-shell">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Volver al perfil
              </Button>
            </div>

            {error ? (
              <div role="alert" className="fl-community-error">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                {error}
              </div>
            ) : vehicle ? (
              <div className="space-y-6">

                <Surface as="section" className="fl-profile-hero">

                  <div className="fl-profile-heading">
                    <div className="fl-profile-identity">
                      <div className="fl-profile-avatar" aria-hidden="true">
                        <Car className="h-12 w-12" />
                      </div>
                      <div className="min-w-0 flex-1">

                        <h1 className="fl-page-title break-words">
                          {vehicle.brand} {vehicle.model}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                            <Calendar className="h-3.5 w-3.5" />
                            {vehicle.year}
                          </span>
                          <span className="fl-community-tag">{vehicle.isPublic ? "Vehículo público" : "Vehículo privado"}</span>
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
                </Surface>

                {(!vehicle.showFuelData || !vehicle.showExpenses || !vehicle.showStatistics) && (
                  <div className="fl-public-privacy" role="note" aria-label="Privacidad del vehículo">
                    <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!vehicle.showFuelData && <span>Repostajes privados</span>}
                    {!vehicle.showExpenses && <span>Gastos privados</span>}
                    {!vehicle.showStatistics && <span>Estadísticas privadas</span>}
                  </div>
                )}

                <Surface as="section" className="fl-surface fl-workspace">
                  <h2 className="fl-section-title mb-5">Especificaciones técnicas</h2>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <article className="fl-public-specification">
                      <div className="fl-community-icon">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Potencia / Motor</p>
                        <p className="break-words text-base font-semibold text-foreground">
                          {vehicle.power ? `${vehicle.power} CV` : 'N/D'} {vehicle.cc ? `- ${vehicle.cc} cc` : ''}
                        </p>
                      </div>
                    </article>

                    <article className="fl-public-specification">
                      <div className="fl-community-icon">
                        <Settings2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Caja de cambios</p>
                        <p className="break-words text-base font-semibold text-foreground">
                          {vehicle.gearbox ? formatGearboxType(vehicle.gearbox) : 'N/D'}
                        </p>
                      </div>
                    </article>

                    <article className="fl-public-specification">
                      <div className="fl-community-icon">
                        <Gauge className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Kilometraje</p>
                        <p className="break-words text-base font-semibold text-foreground">
                          {vehicle.odometer ? `${vehicle.odometer.toLocaleString("es-ES")} ${getOdometerUnit(vehicle.vehicleType)}` : 'N/D'}
                        </p>
                      </div>
                    </article>

                    <article className="fl-public-specification">
                      <div className="fl-community-icon">
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Capacidad depósito</p>
                        <p className="break-words text-base font-semibold text-foreground">
                          {vehicle.tankCapacity ? `${vehicle.tankCapacity} L` : 'N/D'}
                        </p>
                      </div>
                    </article>
                  </div>
                </Surface>

                <div className="grid gap-6 lg:grid-cols-2">
                  {vehicle.showFuelData && (
                    <Surface as="section" className="fl-workspace fl-public-history">
                      <div className="mb-6 flex items-center justify-between shrink-0">
                        <h2 className="fl-section-title">Últimos repostajes</h2>
                        <Fuel className="h-5 w-5 text-primary" />
                      </div>
                      <div tabIndex={0} role="region" aria-label="Historial de repostajes" className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {fuelings.length > 0 ? (
                          fuelings.map((fuel) => (
                            <article key={fuel.id} className="fl-public-record">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{fuel.liters} {getQuantityUnitForFuel(fuel.fuelType)} • {fuel.priceTotal} €</p>
                                <p className="text-xs text-muted-foreground mt-1">{fuel.date} • {fuel.distance} {getOdometerUnit(vehicle.vehicleType)} recorridos</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-teal-400">{fuel.boardConsumption ? `${fuel.boardConsumption} ${getConsumptionUnit(vehicle.vehicleType, vehicle.vehicleEnergyType)}` : '---'}</p>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <p role={extraLoading ? "status" : undefined} className="text-sm text-muted-foreground">{extraLoading ? "Cargando repostajes..." : "No hay repostajes disponibles para mostrar."}</p>
                          </div>
                        )}
                      </div>
                    </Surface>
                  )}

                  {vehicle.showExpenses && (
                    <Surface as="section" className="fl-workspace fl-public-history">
                      <div className="mb-6 flex items-center justify-between shrink-0">
                        <h2 className="fl-section-title">Últimos gastos</h2>
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div tabIndex={0} role="region" aria-label="Historial de gastos" className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {expenses.length > 0 ? (
                          expenses.map((expense) => (
                            <article key={expense.id} className="fl-public-record">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{formatExpenseType(expense.type)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{expense.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">{expense.cost} €</p>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <p role={extraLoading ? "status" : undefined} className="text-sm text-muted-foreground">{extraLoading ? "Cargando gastos..." : "No hay gastos disponibles para mostrar."}</p>
                          </div>
                        )}
                      </div>
                    </Surface>
                  )}
                </div>

                {vehicle.showStatistics && stats && (
                  <Surface as="section" className="fl-surface fl-workspace">
                    <div className="flex items-center justify-between">
                      <h2 className="fl-section-title">Estadísticas verificadas</h2>
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div className="fl-public-stat">
                        <p className="text-xs text-muted-foreground">Consumo medio</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {stats.averageConsumption != null
                            ? `${Number(stats.averageConsumption).toFixed(2)} ${getConsumptionUnit(vehicle.vehicleType, vehicle.vehicleEnergyType)}`
                            : "Sin ciclos completos"}
                        </p>
                      </div>
                      <div className="fl-public-stat">
                        <p className="text-xs text-muted-foreground">Ciclos verificados</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{stats.verifiedCycles || 0}</p>
                      </div>
                      <div className="fl-public-stat">
                        <p className="text-xs text-muted-foreground">Distancia verificada</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {Number(stats.verifiedDistance || 0).toLocaleString("es-ES")} {getOdometerUnit(vehicle.vehicleType)}
                        </p>
                      </div>
                    </div>
                  </Surface>
                )}
                {vehicle.showStatistics && !stats && (
                  <Surface as="section" className="fl-workspace" aria-label="Estadísticas verificadas">
                    <h2 className="fl-section-title">Estadísticas verificadas</h2>
                    <p role={extraLoading ? "status" : undefined} className="fl-supporting mt-3">{extraLoading ? "Cargando estadísticas..." : "No hay estadísticas disponibles para mostrar."}</p>
                  </Surface>
                )}

              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
