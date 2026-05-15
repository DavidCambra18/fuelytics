import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useState } from "react";
import { formatFuelType, formatGearboxType, formatVehicleType } from "../utils/vehicleLabels";

export default function VehicleOverview() {
  const { selectedVehicle } = useOutletContext();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
        <div className="space-y-2 mb-6 flex items-start justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Resumen</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Estado general del vehículo</h2>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to={`/vehicles/${selectedVehicle.id}/edit`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-teal-300/40 hover:text-white"
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm("¿Seguro que quieres eliminar este coche? Esta acción no se puede deshacer.");

                if (!confirmed) return;

                setDeleting(true);
                setError("");

                try {
                  const token = localStorage.getItem("token");
                  const resp = await fetch(`http://localhost:8080/api/vehicles/${selectedVehicle.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    throw new Error(err.message || "Error eliminando el vehículo");
                  }

                  navigate("/dashboard");
                } catch (e) {
                  setError(e.message || "Error eliminando el vehículo");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="rounded-full border border-rose-400/20 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Eliminando..." : "Borrar"}
            </button>
          </div>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
        ) : null}

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
