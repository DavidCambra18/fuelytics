import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { exportReportFile } from "../services/exportReports";

const REPORT_TITLES = {
  fuelings: "Exportar repostajes",
  expenses: "Exportar gastos",
  summary: "Exportar resumen",
};

export default function ExportReportModal(props) {
  if (!props.open || !props.vehicle) return null;

  const resetKey = [props.reportType, props.vehicle.id, props.defaultStartDate, props.defaultEndDate].join("-");
  return <ExportReportDialog key={resetKey} {...props} />;
}

function ExportReportDialog({
  reportType,
  vehicle,
  defaultStartDate = "",
  defaultEndDate = "",
  onClose,
}) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusableSelector = "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";
    dialog?.querySelector(focusableSelector)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusableElements = [...dialog.querySelectorAll(focusableSelector)];
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Debes indicar una fecha de inicio y una fecha de fin.");
      return;
    }

    if (startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la fecha fin.");
      return;
    }

    setLoading(true);
    try {
      await exportReportFile({ reportType, vehicle, startDate, endDate, format: "pdf" });
      onClose();
    } catch (exportError) {
      const errorMessage = exportError.message || "";
      setError(
        errorMessage.includes("404") || errorMessage.toLowerCase().includes("no data")
          ? "No hay datos en las fechas seleccionadas."
          : errorMessage || "No se pudo generar la exportación."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-2xl shadow-black/50 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-teal-300">Exportación</p>
            <h3 id={titleId} className="mt-2 text-2xl font-semibold text-white">
              {REPORT_TITLES[reportType] || "Exportar informe"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              El archivo se descargará con el rango de fechas seleccionado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Cerrar exportación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <div role="alert" className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">Fecha inicio</span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-teal-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">Fecha fin</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-teal-400"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generando..." : "Descargar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
