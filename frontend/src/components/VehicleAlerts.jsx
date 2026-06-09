import { useEffect, useState } from "react";
import { Wrench, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../services/api";

export default function VehicleAlerts({ vehicleId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!vehicleId) return;
      try {
        const response = await apiFetch(`/api/vehicles/${vehicleId}/alerts`);
        if (response.ok) {
          const data = await response.json();
          setAlerts(data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [vehicleId]);

  const getIcon = (description) => {
    const desc = description?.toLowerCase() || "";
    if (desc.includes("aceite")) return Droplets;
    return Wrench;
  };

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
      case "CRITICAL":
        return {
          card: "border-red-500/30 bg-red-500/10",
          badge: "bg-red-500/20 text-red-300 border-red-500/30",
          text: "text-red-400",
          icon: AlertTriangle,
          label: "URGENTE"
        };
      case "WARNING":
        return {
          card: "border-amber-500/30 bg-amber-500/10",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          text: "text-amber-400",
          icon: AlertTriangle,
          label: "AVISO"
        };
      default:
        return {
          card: "border-slate-700/50 bg-slate-950/30",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          text: "text-slate-300",
          icon: CheckCircle2,
          label: "OK"
        };
    }
  };

  const formatDateEs = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (loading || alerts.length === 0) return null;

  return (
    <div className="mt-1 space-y-2 border-t border-white/5 pt-3">
      <div className="flex items-center gap-1.5 px-1">
        <Wrench className="h-3.5 w-3.5 text-teal-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alertas</h3>
      </div>

      <div className="flex flex-col gap-2">
        {alerts.map((alert, index) => {
          const styles = getUrgencyStyles(alert.urgency);
          const CustomIcon = getIcon(alert.description);
          const isOverdue = alert.remainingKm <= 0;

          return (
            <div
              key={index}
              className={`flex items-center justify-between rounded-xl border p-2.5 transition duration-200 ${styles.card}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/10 ${styles.text}`}>
                  <CustomIcon className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold text-white capitalize">
                    {alert.description || "Mantenimiento"}
                  </span>
                  <span className="truncate text-[10px] font-medium text-slate-400">
                    {isOverdue 
                      ? `Vencido por ${Math.abs(alert.remainingKm).toLocaleString("es-ES")} km` 
                      : `En ${alert.remainingKm.toLocaleString("es-ES")} km`
                    }
                    {alert.nextMaintenanceDate && ` • ${formatDateEs(alert.nextMaintenanceDate)}`}
                  </span>
                </div>
              </div>

              <span className={`ml-2 shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-bold tracking-wide ${styles.badge}`}>
                {styles.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}