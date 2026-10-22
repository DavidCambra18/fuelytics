import useActionGuard from "../hooks/useActionGuard";
import { useEffect, useState } from "react";
import { Wrench, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { apiFetch } from "../services/api";

export default function VehicleAlerts({ vehicleId }) {
  const { guard, isActive } = useActionGuard();
  const [actionError, setActionError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadAlerts = async () => {
      if (!vehicleId) return;
      try {
        const response = await apiFetch(`/api/vehicles/${vehicleId}/alerts`, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted) setAlerts(data || []);
        }
      } catch (error) {
        if (!controller.signal.aborted) console.error(error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadAlerts();
    return () => controller.abort();
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

  const completeAlert = guard(async (expenseId) => {
    setActionError("");
    setCompletingId(expenseId);
    try {
      const response = await apiFetch(`/api/vehicles/${vehicleId}/alerts/${expenseId}/complete`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("No se pudo completar la alerta");
      if (!isActive()) return;
      setAlerts((current) => current.filter((alert) => alert.expenseId !== expenseId));
    } catch (error) {
      if (isActive()) setActionError(error.message || "No se pudo completar la alerta");
    } finally {
      setCompletingId(null);
    }
  });

  if (loading || alerts.length === 0) return null;

  return (
    <div className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4">
      <div className="flex items-center gap-1.5 px-1">
        <Wrench className="h-3.5 w-3.5 text-teal-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alertas</h3>
      </div>

      {actionError ? <p role="alert" className="fl-feedback-error">{actionError}</p> : null}
      <div className="flex flex-col gap-2">
        {alerts.map((alert, index) => {
          const styles = getUrgencyStyles(alert.urgency);
          const CustomIcon = getIcon(alert.description);
          const isOverdue = alert.remainingKm != null && alert.remainingKm <= 0;
          const isDateOverdue = alert.remainingDays != null && alert.remainingDays <= 0;

          return (
            <div
              key={alert.expenseId || index}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${styles.card}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/10 ${styles.text}`}>
                  <CustomIcon className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="break-words text-sm font-medium text-foreground capitalize">
                    {alert.description || "Mantenimiento"}
                  </span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {alert.remainingKm != null && (isOverdue
                      ? `Vencido por ${Math.abs(alert.remainingKm).toLocaleString("es-ES")} km`
                      : `En ${alert.remainingKm.toLocaleString("es-ES")} km`)}
                    {alert.remainingKm != null && alert.nextMaintenanceDate && " • "}
                    {alert.nextMaintenanceDate && (isDateOverdue ? "Fecha vencida: " : "Fecha: ")}
                    {alert.nextMaintenanceDate && formatDateEs(alert.nextMaintenanceDate)}
                  </span>
                </div>
              </div>

              <div className="ml-2 flex shrink-0 items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${styles.badge}`}>
                  {styles.label}
                </span>
                <Button variant="outline"
                  type="button"
                  onClick={() => completeAlert(alert.expenseId)}
                  pending={completingId === alert.expenseId} pendingLabel="Guardando" disabled={completingId !== null}
                  aria-label={completingId === alert.expenseId ? `Guardando ${alert.description || "mantenimiento"}` : `Marcar como hecho: ${alert.description || "mantenimiento"}`}
                  className="focus-visible:transition-none"
                >
                  Hecho
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
