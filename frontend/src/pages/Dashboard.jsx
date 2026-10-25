import { loadRequest } from "../utils/loadRequest";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import { CarFront, Plus, ArrowUpRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Surface } from "../components/ui/surface";
import VehicleAlerts from "../components/VehicleAlerts";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadRequest({
      signal: controller.signal,
      load: async () => {
        const response = await apiFetch("/api/vehicles", { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudieron cargar los vehículos");
        return response.json();
      },
      onSuccess: setVehicles,
      onError: (error) => setError(error.message || "Error cargando vehículos"),
      onSettled: () => setLoading(false),
    });
    return () => controller.abort();
  }, []);

  return (
    <main className="section-shell pb-10 fl-garage">
      <Surface as="section" className="fl-workspace">
        <header className="fl-workspace-heading">
          <div>
            <p className="fl-eyebrow">Tus vehículos, a punto</p>
            <h1 className="fl-page-title mt-2">Tu garaje</h1>
            <p className="fl-supporting mt-3">Repostajes, mantenimiento y gastos. Todo empieza por tu vehículo.</p>
          </div>
          <Button asChild><Link to="/vehicles/new" data-tour="create-vehicle"><Plus aria-hidden="true" />Crear coche</Link></Button>
        </header>
        {loading ? <p role="status" className="fl-supporting py-8">Cargando vehículos...</p>
          : error ? <p role="alert" className="fl-feedback-error">{error}</p>
          : vehicles.length === 0 ? (
            <div className="fl-empty-vehicle">
              <CarFront size={32} aria-hidden="true" />
              <h2 className="fl-section-title">Tu primer vehículo te espera</h2>
              <p className="fl-supporting">No hay vehículos registrados todavía. Crea tu primer coche para empezar a usar la plataforma.</p>
              <Button asChild><Link to="/vehicles/new">Registrar primer coche</Link></Button>
            </div>
          ) : (
            <div className="fl-garage-grid">
              {vehicles.map((vehicle) => (
                <Surface key={vehicle.id} as="article" variant="inset" className="fl-garage-card">
                  <Link to={`/vehicles/${vehicle.id}`} className="fl-garage-link">
                    <span className="fl-vehicle-symbol"><CarFront size={28} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="fl-eyebrow">{vehicle.brand}</span>
                      <h2 className="fl-garage-model">{vehicle.model}</h2>
                      <span className="fl-vehicle-specs"><span>{vehicle.year}</span><span>{vehicle.power} CV</span><span>{vehicle.cc} cc</span></span>
                    </span>
                    <ArrowUpRight size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                  <VehicleAlerts vehicleType={vehicle.vehicleType} vehicleId={vehicle.id} />
                </Surface>
              ))}
            </div>
          )}
      </Surface>
    </main>
  );
}
