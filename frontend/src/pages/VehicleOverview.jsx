import { Link, useOutletContext } from "react-router-dom";
import { formatFuelType, formatGearboxType, formatVehicleType } from "../utils/vehicleLabels";

export default function VehicleOverview() {
  const { selectedVehicle } = useOutletContext();

  const vehicleInfo = [
    { label: "Marca", value: selectedVehicle.brand || "No definido" },
    { label: "Modelo", value: selectedVehicle.model || "No definido" },
    { label: "Año", value: selectedVehicle.year || "No definido" },
    { label: "Potencia", value: selectedVehicle.power ? `${selectedVehicle.power} CV` : "No definido" },
    { label: "Cilindrada", value: selectedVehicle.cc ? `${selectedVehicle.cc} cc` : "No definido" },
    { label: "Combustible", value: formatFuelType(selectedVehicle.fuelType) },
    { label: "Cambio", value: formatGearboxType(selectedVehicle.gearbox) },
    { label: "Capacidad depósito", value: selectedVehicle.tankCapacity ? `${selectedVehicle.tankCapacity} L` : "No definido" },
    { label: "Consumo oficial", value: selectedVehicle.officialConsumption ? `${selectedVehicle.officialConsumption} L/100km` : "No definido" },
    { label: "Odómetro", value: selectedVehicle.odometer ? `${selectedVehicle.odometer.toLocaleString("es-ES")} km` : "No definido" },
  ];

  return (
    <section className="w-full">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-2 mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Resumen</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Estado general del vehículo</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicleInfo.map(({ label, value }) => (
            <div key={label} className="group relative rounded-2xl border border-teal-300/20 bg-gradient-to-br from-teal-300/10 via-slate-900/40 to-slate-950/40 p-5 hover:border-teal-300/40 transition duration-300">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400/0 via-transparent to-teal-400/0 group-hover:from-teal-400/5 group-hover:to-teal-400/5 transition duration-300" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-300/50 font-semibold">{label}</p>
                <p className="mt-2 text-lg sm:text-xl font-bold text-white break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
