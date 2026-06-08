import { useState, useEffect } from "react";
import { Calculator, MapPin, Fuel, Users, Wallet, Droplets, Gauge } from "lucide-react";
import { apiFetch } from "../services/api";

export default function TripCalculator() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [distance, setDistance] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [people, setPeople] = useState(1);
  const [consumption, setConsumption] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await apiFetch("/api/vehicles");
        if (response.ok) {
          const data = await response.json();
          setVehicles(data);
          if (data.length > 0) {
            setSelectedVehicleId(data[0].id.toString());
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedVehicleId) return;
      try {
        const response = await apiFetch(`/api/vehicles/${selectedVehicleId}/statistics`);
        if (response.ok) {
          const data = await response.json();
          if (data.averageConsumption > 0) {
            setConsumption(data.averageConsumption.toFixed(2));
          } else {
            setConsumption("");
          }
        }
      } catch (error) {
        setConsumption("");
      }
    };
    fetchStats();
  }, [selectedVehicleId]);

  const numDistance = parseFloat(distance) || 0;
  const numPrice = parseFloat(fuelPrice) || 0;
  const numPeople = parseInt(people, 10) || 1;
  const numConsumption = parseFloat(consumption) || 0;

  const estimatedLiters = (numDistance * numConsumption) / 100;
  const totalCost = estimatedLiters * numPrice;
  const costPerPerson = numPeople > 0 ? totalCost / numPeople : totalCost;

  if (loading) {
    return (
      <div className="w-full py-10 text-slate-100">
        <section className="glass-panel mx-auto max-w-3xl rounded-[2rem] p-8 text-sm text-slate-300">
          Cargando calculadora...
        </section>
      </div>
    );
  }

  return (
    <section className="w-full pt-8 space-y-6 lg:pt-30">
      <article className="glass-panel mx-auto max-w-5xl rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Herramientas</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Calculator className="h-7 w-7 text-teal-500" />
              Calculadora de Viaje
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 max-w-2xl">
              Estima el coste de tu próximo trayecto y divide los gastos fácilmente.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  Vehículo (opcional)
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-teal-500"
                >
                  {vehicles.length === 0 ? (
                    <option value="">Sin vehículos</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Gauge className="h-4 w-4 text-teal-500" />
                  Consumo (L/100km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  placeholder="Ej: 6.5"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <MapPin className="h-4 w-4 text-teal-500" />
                  Distancia (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Ej: 450"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-teal-500"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Fuel className="h-4 w-4 text-teal-500" />
                  Precio combustible (€/L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder="Ej: 1.659"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Users className="h-4 w-4 text-teal-500" />
                Número de personas
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/30 p-6 h-fit">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">Estimación</h3>
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Droplets className="h-5 w-5 text-teal-500/70" />
                <span className="text-sm">Litros necesarios</span>
              </div>
              <span className="font-mono text-lg font-medium text-white">
                {estimatedLiters.toFixed(2)} L
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 py-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Wallet className="h-5 w-5 text-teal-500/70" />
                <span className="text-sm">Coste total</span>
              </div>
              <span className="font-mono text-xl font-bold text-teal-400">
                {totalCost.toFixed(2)} €
              </span>
            </div>

            <div className={`flex flex-col pt-4 transition-all duration-300 ${numPeople > 1 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300">
                  <Users className="h-5 w-5 text-teal-500/70" />
                  <span className="text-sm font-medium">Por persona</span>
                </div>
                <span className="font-mono text-2xl font-bold text-white">
                  {costPerPerson.toFixed(2)} €
                </span>
              </div>
              {numPeople <= 1 && (
                <p className="text-[10px] text-right mt-2 text-slate-500">
                  Añade más pasajeros para dividir el coste
                </p>
              )}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}