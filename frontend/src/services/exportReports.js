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

export async function exportReportFile({ reportType, vehicle, startDate, endDate, format = "csv" }) {
  const params = new URLSearchParams();

  if (startDate) {
    params.set("startDate", startDate);
  }

  if (endDate) {
    params.set("endDate", endDate);
  }

  if (format) {
    params.set("format", format);
  }

  const query = params.toString();
  const response = await apiFetch(`/api/export/${reportType}/${vehicle.id}${query ? `?${query}` : ""}`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || payload.error || "No se pudo generar la exportación");
  }

  const blob = await response.blob();
  const filename = extractFilename(response.headers.get("content-disposition"))
    || buildFallbackFilename(reportType, vehicle, startDate, endDate, format);

  downloadBlob(blob, filename);
  return filename;
}
