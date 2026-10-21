import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Surface } from "../components/ui/surface";
import { apiFetch } from "../services/api";
import { useState } from "react";
import { formatGearboxType, formatVehicleEnergyType, getConsumptionUnit, getOdometerLabel, getOdometerUnit } from "../utils/vehicleLabels";

export default function VehicleOverview() {
  const { selectedVehicle } = useOutletContext();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const vehicleInfo = [
    { label: "Combustible", value: formatVehicleEnergyType(selectedVehicle.vehicleEnergyType) },
    { label: "Marca", value: selectedVehicle.brand || "---" },
    { label: "Modelo", value: selectedVehicle.model || "---" },
    { label: "Año", value: selectedVehicle.year || "---" },
    { label: "Potencia", value: selectedVehicle.power ? `${selectedVehicle.power} CV` : "---" },
    { label: "Cilindrada", value: selectedVehicle.cc ? `${selectedVehicle.cc} cc` : "---" },
    { label: "Cambio", value: formatGearboxType(selectedVehicle.gearbox) },
    { label: "Capacidad depósito", value: selectedVehicle.tankCapacity ? `${selectedVehicle.tankCapacity} L` : "---" },
    { label: "Consumo oficial", value: selectedVehicle.officialConsumption ? `${selectedVehicle.officialConsumption} ${getConsumptionUnit(selectedVehicle.vehicleType, selectedVehicle.vehicleEnergyType)}` : "---" },
    { label: getOdometerLabel(selectedVehicle.vehicleType), value: selectedVehicle.odometer ? `${selectedVehicle.odometer.toLocaleString("es-ES")} ${getOdometerUnit(selectedVehicle.vehicleType)}` : "---" },
  ];

  return (
    <section className="w-full">
      <Surface as="article" className="fl-workspace">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="fl-eyebrow">Resumen</p><h2 className="fl-section-title mt-2">La ficha de tu vehículo</h2></div>
          <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
            <Button asChild variant="outline" className="flex-1 sm:flex-none focus-visible:transition-none"><Link to={`/vehicles/${selectedVehicle.id}/edit`}><Pencil aria-hidden="true" />Editar</Link></Button>
            <Button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm("¿Seguro que quieres eliminar este coche? Esta acción no se puede deshacer.");

                if (!confirmed) return;

                setDeleting(true);
                setError("");

                try {
                  const resp = await apiFetch(`/api/vehicles/${selectedVehicle.id}`, {
                    method: "DELETE",
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
              variant="destructive" className="flex-1 sm:flex-none focus-visible:transition-none"
            >
              <Trash2 aria-hidden="true" />{deleting ? "Eliminando..." : "Borrar"}
            </Button>
          </div>
        </div>
        {error ? (
          <div role="alert" className="fl-feedback-error">{error}</div>
        ) : null}

        <div className="fl-vehicle-facts">
          {[
            { title: "Identificación", items: vehicleInfo.slice(0, 4) },
            { title: "Motor y transmisión", items: vehicleInfo.slice(4, 7) },
            { title: "Uso y consumo", items: vehicleInfo.slice(7) },
          ].map(({ title, items }) => (
            <section key={title}>
              <h3 className="fl-facts-heading">{title}</h3>
              <dl>{items.map(({ label, value }) => (
                <div key={label} className="fl-fact-row"><dt>{label}</dt><dd>{value}</dd></div>
              ))}</dl>
            </section>
          ))}
        </div>
      </Surface>
    </section>
  );
}
