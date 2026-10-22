import { loadRequest } from "../utils/loadRequest";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, Check } from "lucide-react";
import { apiFetch } from "../services/api";
import { getConsumptionUnit, getOdometerUnit, getQuantityUnit, getUnitPriceLabel } from "../utils/vehicleLabels";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import ExportReportModal from "../components/ExportReportModal";
import { buildFuelingRows, summarizeConsumption } from "../utils/consumption";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function formatDateLabel(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatFullDate(value) {
  if (!value) {
    return "No definida";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function Statistics() {
  const { selectedVehicle } = useOutletContext();
  const [fuelings, setFuelings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("consumption");
  const [exportTarget, setExportTarget] = useState(null);
  const consumptionUnit = getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType);
  const distanceUnit = getOdometerUnit(selectedVehicle?.vehicleType);
  const quantityUnit = getQuantityUnit(selectedVehicle?.vehicleEnergyType);
  const unitPriceLabel = getUnitPriceLabel(selectedVehicle?.vehicleEnergyType);
  const costRateLabel = selectedVehicle?.vehicleType === "agricultural" ? "Coste por hora" : "Coste por 100 km";

  useEffect(() => {
    if (!selectedVehicle?.id) return;
    const controller = new AbortController();
    loadRequest({
      signal: controller.signal,
      load: async () => {
        const response = await apiFetch(`/api/fuelings/vehicle/${selectedVehicle.id}`, { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudieron cargar las estadísticas");
        return response.json();
      },
      onSuccess: (data) => setFuelings(data || []),
      onError: (error) => setError(error.message || "Error cargando estadísticas"),
      onSettled: () => setLoading(false),
    });
    return () => controller.abort();
  }, [selectedVehicle?.id]);

  const chartFuelings = useMemo(
    () =>
      [...fuelings].sort((first, second) => {
        const firstDate = new Date(`${first.date}T00:00:00`).getTime();
        const secondDate = new Date(`${second.date}T00:00:00`).getTime();
        return firstDate - secondDate;
      }),
    [fuelings]
  );

  const fuelingRows = useMemo(
    () => buildFuelingRows(fuelings, selectedVehicle?.vehicleType),
    [fuelings, selectedVehicle?.vehicleType]
  );

  const metrics = useMemo(() => {
    const totalDistance = fuelings.reduce((acc, fueling) => acc + Number(fueling.distance || 0), 0);
    const totalLiters = fuelings.reduce((acc, fueling) => acc + Number(fueling.liters || 0), 0);
    const totalPrice = fuelings.reduce((acc, fueling) => acc + Number(fueling.priceTotal || 0), 0);
    const totalEntries = fuelings.length;

    const summary = summarizeConsumption(fuelingRows, selectedVehicle);
    const averageDistance = totalEntries > 0 ? totalDistance / totalEntries : 0;

    return {
      totalDistance,
      totalLiters,
      totalPrice,
      totalEntries,
      averageConsumption: summary.averageConsumption,
      costPer100Km: summary.costPerUnit,
      averageFuelPrice: summary.averageUnitPrice,
      averageDistance,
    };
  }, [fuelings, fuelingRows, selectedVehicle]);

  const chartColors = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim();
    return { primary: read("--primary"), foreground: read("--foreground"), muted: read("--muted-foreground"), surface: read("--popover"), border: read("--border-subtle"), font: read("--font-sans") };
  }, []);

  const chartData = useMemo(() => {
    const cumulativeFuelings = [];
    const verifiedPoints = [];

    for (const fueling of chartFuelings) {
      cumulativeFuelings.push(fueling);
      if (fueling.refueling !== "complete") continue;

      const rows = buildFuelingRows(cumulativeFuelings, selectedVehicle?.vehicleType);
      const summary = summarizeConsumption(rows, selectedVehicle);
      if (summary.verifiedCycles > 0) {
        verifiedPoints.push({ date: fueling.date, summary });
      }
    }

    if (selectedMetric === "consumption") {
      return {
        labels: verifiedPoints.map((point) => formatDateLabel(point.date)),
        datasets: [
          {
            label: `Media acumulada (${consumptionUnit})`,
            data: verifiedPoints.map((point) => point.summary.averageConsumption),
            borderColor: chartColors.primary,
            backgroundColor: "rgba(56, 216, 195, 0.08)",
            pointBackgroundColor: chartColors.primary,
            pointBorderColor: chartColors.surface,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: true,
          },
        ],
      };
    } else if (selectedMetric === "costPer100Km") {
      return {
        labels: verifiedPoints.map((point) => formatDateLabel(point.date)),
        datasets: [
          {
            label: `${costRateLabel} (€)`,
            data: verifiedPoints.map((point) => point.summary.costPerUnit),
            borderColor: "#fbbf24",
            backgroundColor: "rgba(251, 191, 36, 0.12)",
            pointBackgroundColor: "#fcd34d",
            pointBorderColor: chartColors.surface,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: true,
          },
        ],
      };
    } else if (selectedMetric === "fuelPrice") {
      return {
        labels: verifiedPoints.map((point) => formatDateLabel(point.date)),
        datasets: [
          {
            label: `Precio medio (${unitPriceLabel})`,
            data: verifiedPoints.map((point) => point.summary.averageUnitPrice),
            borderColor: chartColors.foreground,
            backgroundColor: "rgba(234, 242, 247, 0.06)",
            pointBackgroundColor: chartColors.foreground,
            pointBorderColor: chartColors.surface,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: true,
          },
        ],
      };
    }
  }, [chartFuelings, selectedMetric, consumptionUnit, costRateLabel, unitPriceLabel, selectedVehicle, chartColors]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: chartColors.surface,
          titleColor: chartColors.foreground,
          bodyColor: chartColors.foreground,
          titleFont: { family: chartColors.font },
          bodyFont: { family: chartColors.font },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => {
              if (selectedMetric === "consumption") {
                return `${Number(context.raw || 0).toFixed(2)} ${consumptionUnit}`;
              } else if (selectedMetric === "costPer100Km") {
                return `${Number(context.raw || 0).toFixed(2)} €`;
              } else if (selectedMetric === "fuelPrice") {
                return `${Number(context.raw || 0).toFixed(3)} ${unitPriceLabel}`;
              }
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: chartColors.muted,
            font: { family: chartColors.font, size: 12 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
          grid: {
            color: chartColors.border,
          },
        },
        y: {
          beginAtZero: false,
          ticks: {
            color: chartColors.muted,
            font: { family: chartColors.font, size: 12 },
          },
          grid: {
            color: chartColors.border,
          },
        },
      },
    }),
    [selectedMetric, consumptionUnit, unitPriceLabel, chartColors]
  );

  const cards = [
    {
      label: "Consumo medio",
      value: `${metrics.averageConsumption.toFixed(2)} ${consumptionUnit}`,
      note: `Cantidad verificada dividida entre ${distanceUnit === "h" ? "horas de uso" : "kilómetros recorridos"}`,
    },
    {
      label: costRateLabel,
      value: `${metrics.costPer100Km.toFixed(2)} €`,
      note: selectedVehicle?.vehicleType === "agricultural" ? "Coste verificado por hora" : "Coste verificado por cada 100 kilómetros",
    },
    {
      label: "Precio medio combustible",
      value: `${metrics.averageFuelPrice.toFixed(3)} ${unitPriceLabel}`,
      note: `Precio medio pagado por ${quantityUnit}`,
    },
  ];

  const recentFuelings = useMemo(() => {
    return [...fuelingRows].reverse().slice(0, 5);
  }, [fuelingRows]);
  const exportDateRange = useMemo(() => {
    if (fuelings.length === 0) {
      return {};
    }

    const dates = fuelings
      .map((fueling) => fueling.date)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) {
      return {};
    }

    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    };
  }, [fuelings]);

  return (
    <section className="space-y-6 fl-statistics">
      <Surface as="article" className="fl-workspace">
        <header className="fl-workspace-heading">
          <div><h2 className="fl-page-title">Estadísticas</h2><p className="fl-supporting mt-3">Resumen del comportamiento del vehículo a partir de sus repostajes.</p></div>
          <Button type="button" variant="outline" disabled={loading || !!error} onClick={() => setExportTarget({ reportType: "summary", vehicle: selectedVehicle })} aria-label="Exportar resumen"><Download aria-hidden="true" />Exportar resumen</Button>
        </header>

        {error ? (
          <div role="alert" className="fl-feedback-error">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div role="status" className="fl-expense-state">Cargando estadísticas...</div>
        ) : !error ? (
          <>
            <div className="fl-metric-selector" role="group" aria-label="Métrica de la gráfica">
              {cards.map((card, index) => {
                const cardMetricKey = index === 0 ? "consumption" : index === 1 ? "costPer100Km" : "fuelPrice";
                const isSelected = selectedMetric === cardMetricKey;

                return (
                  <button
                    key={card.label}
                    onClick={() => setSelectedMetric(cardMetricKey)}
                    type="button"
                    aria-pressed={isSelected}
                    className="fl-metric-choice"
                  >
                    <span className="fl-metric-label">{card.label}{isSelected ? <Check size={16} aria-hidden="true" /> : null}</span>
                    <p className="fl-metric-value">{card.value}</p>
                    <p className="fl-supporting mt-2">{card.note}</p>
                  </button>
                );
              })}
            </div>

            <section className="fl-chart-section" aria-labelledby="statistics-chart-title">
              <div className="flex items-start justify-between gap-4">
                <div>

                  <h3 id="statistics-chart-title" className="fl-section-title">
                    {selectedMetric === "consumption"
                      ? "Consumo medio acumulado"
                      : selectedMetric === "costPer100Km"
                        ? `${costRateLabel} acumulado`
                        : "Precio medio combustible acumulado"}
                  </h3>
                </div>
              </div>

              <div className="fl-chart-canvas">
                {chartData.labels.length > 0 ? (
                  <Line data={chartData} options={chartOptions} role="img" aria-labelledby="statistics-chart-title" aria-describedby="statistics-chart-description" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground text-center">
                    Todavía no hay datos suficientes para dibujar la gráfica.
                  </div>
                )}
              </div>
              <p id="statistics-chart-description" className="fl-supporting mt-3">Media acumulada de los ciclos verificados. Selecciona una métrica para comparar su evolución.</p>
              {chartData.labels.length > 0 ? (
                <details className="fl-chart-data">
                  <summary>Ver datos de la gráfica</summary>
                  <table>
                    <caption className="sr-only">{chartData.datasets[0].label}</caption>
                    <thead><tr><th scope="col">Fecha</th><th scope="col">{chartData.datasets[0].label}</th></tr></thead>
                    <tbody>{chartData.labels.map((label, index) => (
                      <tr key={`${label}-${index}`}><td>{label}</td><td>{Number(chartData.datasets[0].data[index]).toFixed(selectedMetric === "fuelPrice" ? 3 : 2)}</td></tr>
                    ))}</tbody>
                  </table>
                </details>
              ) : null}
            </section>
          </>
        ) : null}
      </Surface>

      <Surface as="article" className="fl-workspace">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="fl-section-title">Últimos repostajes</h3>
          </div>
          {!loading && !error ? <p className="fl-ledger-count">{fuelings.length} registros</p> : null}
        </div>

        {loading ? <div role="status" className="fl-expense-state">Cargando últimos repostajes...</div> : error ? (
          <p className="fl-expense-state">No se pudieron cargar los últimos repostajes.</p>
        ) : recentFuelings.length === 0 ? (
          <div className="fl-expense-state">
            Todavía no hay repostajes para mostrar.
          </div>
        ) : (
          <div className="mt-5">
            <table className="fl-statistics-history"><caption className="sr-only">Los cinco repostajes más recientes</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Importe</th>
                  <th scope="col">Distancia</th>
                  <th scope="col">Consumo</th>
                </tr>
              </thead>
              <tbody>
                {recentFuelings.map((fueling) => {
                  const liters = Number(fueling.liters || 0);
                  const distance = Number(fueling.distance || 0);
                  const priceTotal = Number(fueling.priceTotal || 0);
                  const isVerified = fueling.displayState === "verified";
                  const consumption = isVerified && fueling.displayConsumption != null
                    ? Number(fueling.displayConsumption).toFixed(2)
                    : null;

                  return (
                    <tr key={fueling.id} >
                      <td data-label="Fecha">{formatFullDate(fueling.date)}</td>
                      <td data-label="Cantidad">{liters.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quantityUnit}</td>
                      <td data-label="Importe">{priceTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                      <td data-label="Distancia">{distance.toLocaleString("es-ES", { maximumFractionDigits: 1 })} {distanceUnit}</td>
                      <td data-label="Consumo">{consumption !== null ? `${consumption} ${consumptionUnit}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {exportTarget ? (
        <ExportReportModal
          appearance="atlantic"
          open={Boolean(exportTarget)}
          reportType={exportTarget.reportType}
          vehicle={exportTarget.vehicle}
          defaultStartDate={exportDateRange.startDate || ""}
          defaultEndDate={exportDateRange.endDate || ""}
          onClose={() => setExportTarget(null)}
        />
      ) : null}
    </section>
  );
}
