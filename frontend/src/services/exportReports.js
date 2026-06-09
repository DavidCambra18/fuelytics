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

export async function exportReportFile({ reportType, vehicle, startDate, endDate, format = "pdf" }) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const endpoint = `/api/export/${reportType}/${vehicle.id}?${queryParams.toString()}`;

  const res = await apiFetch(endpoint, {
    method: "GET",
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = "No hay datos en las fechas seleccionadas";
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
    }
    throw new Error(errorMessage);
  }

  const blob = await res.blob();

  const contentDisposition = res.headers.get("Content-Disposition");
  const fallbackName = buildFallbackFilename(reportType, vehicle, startDate, endDate, format);
  const filename = extractFilename(contentDisposition) || fallbackName;

  downloadBlob(blob, filename);
}
