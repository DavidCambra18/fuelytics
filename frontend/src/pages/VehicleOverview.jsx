import { Link, useOutletContext } from "react-router-dom";
import { formatFuelType, formatGearboxType, formatVehicleType } from "../utils/vehicleLabels";

export default function VehicleOverview() {
  const { selectedVehicle } = useOutletContext();

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resumen</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Estado general del vehículo</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Esta vista reúne la información principal del coche seleccionado y sirve como punto de partida para sus secciones específicas.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Año", selectedVehicle.year || "No definido"],
            ["Potencia", selectedVehicle.power ? `${selectedVehicle.power} CV` : "No definido"],
            ["Cilindrada", selectedVehicle.cc ? `${selectedVehicle.cc} cc` : "No definido"],
            ["Combustible", formatFuelType(selectedVehicle.fuelType)],
            ["Cambio", formatGearboxType(selectedVehicle.gearbox)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
