import { apiFetch } from "./api";

const REPORT_LABELS = {
  fuelings: "repostajes",
  expenses: "gastos",
  summary: "resumen",
};

function buildFallbackFilename(reportType, vehicle, startDate, endDate, format) {
  const vehicleLabel = [vehicle?.brand, vehicle?.model]
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "vehiculo";

  const dateLabel = startDate && endDate
    ? `${startDate}_${endDate}`
    : startDate
      ? `${startDate}_en_adelante`
      : endDate
        ? `hasta_${endDate}`
        : "todo";

  return `fuelytics_${REPORT_LABELS[reportType] || reportType}_${vehicleLabel}_${dateLabel}.${format}`;
}

function extractFilename(contentDisposition) {
  if (!contentDisposition) {
    return "";
  }

  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)\"?/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function exportReportFile(options) {
  const res = await apiFetch("/api/export", {
    method: "POST",
    body: options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "No hay datos en las fechas seleccionadas");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "exportacion.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
