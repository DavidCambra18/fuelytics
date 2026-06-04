import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { exportReportFile } from "../services/exportReports";

const REPORT_TITLES = {
  fuelings: "Exportar repostajes",
  expenses: "Exportar gastos",
  summary: "Exportar resumen",
};

export default function ExportReportModal({
  open,
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

  useEffect(() => {
    if (!open) {
      return;
    }

    setStartDate(defaultStartDate || "");
    setEndDate(defaultEndDate || "");
    setError("");
    setLoading(false);
  }, [defaultEndDate, defaultStartDate, open, reportType]);

  if (!open || !vehicle) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (startDate && endDate && startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la fecha fin");
      return;
    }

    setLoading(true);

    try {
      await exportReportFile({
        reportType,
        vehicle,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format: "pdf",
      });
      onClose();
    } catch (exportError) {
      setError(exportError.message || "No se pudo generar la exportación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-teal-300">Exportación</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
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
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">Fecha inicio</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-teal-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">Fecha fin</span>
              <input
                type="date"
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