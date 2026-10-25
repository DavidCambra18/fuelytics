import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";
import { Button } from "./ui/button";
import { apiJson } from "../services/api";

export default function VehicleAlerts({ vehicleId }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retryReturn = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const data = await apiJson(`/api/vehicles/${vehicleId}/reminders`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setReminders(data.filter((item) => item.status === "PENDING"
          && (item.urgency === "WARNING" || item.urgency === "CRITICAL")));
        setError("");
        retryReturn.current?.focus({ preventScroll: true });
        retryReturn.current = null;
      } catch (failure) {
        if (!controller.signal.aborted && failure.name !== "AbortError") {
          setError("No se pudieron consultar los recordatorios de mantenimiento.");
          retryReturn.current = null;
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [vehicleId, attempt]);
  if (error) return <div className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4">
    <p role="alert" className="fl-feedback-error text-sm">{error}</p>
    <Button variant="outline" pending={loading} pendingLabel="Consultando..." disabled={loading} onClick={(event) => {
      retryReturn.current = event.currentTarget.closest("article")?.querySelector("a[href]");
      setAttempt((current) => current + 1);
    }}>Reintentar</Button>
  </div>;
  if (loading || !reminders.length) return null;
  return <section className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4" aria-label="Recordatorios de mantenimiento">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Wrench className="h-4 w-4" aria-hidden="true" />Recordatorios</h3>
    {reminders.map((reminder) => <div key={reminder.id} className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="break-words text-sm font-medium">{reminder.title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {reminder.remainingKm != null ? reminder.remainingKm <= 0 ? `Vencido por ${Math.abs(reminder.remainingKm).toLocaleString("es-ES")} km` : `En ${reminder.remainingKm.toLocaleString("es-ES")} km` : null}
        {reminder.remainingKm != null && reminder.targetDate ? " · " : ""}
        {reminder.targetDate ? new Intl.DateTimeFormat("es-ES").format(new Date(`${reminder.targetDate}T00:00:00`)) : null}
      </p>
      <span className={`mt-2 inline-block text-xs font-medium ${reminder.urgency === "CRITICAL" ? "text-rose-300" : reminder.urgency === "WARNING" ? "text-amber-200" : "text-muted-foreground"}`}>
        {reminder.urgency === "CRITICAL" ? "Urgente" : reminder.urgency === "WARNING" ? "Próximo" : "Programado"}
      </span>
    </div>)}
    <Button asChild variant="outline" className="w-full"><Link to={`/vehicles/${vehicleId}/reminders`}>Gestionar recordatorios</Link></Button>
  </section>;
}
