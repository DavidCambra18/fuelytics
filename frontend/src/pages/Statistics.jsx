import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download } from "lucide-react";
import { apiFetch } from "../services/api";
import { getConsumptionUnit, getOdometerUnit, getQuantityUnit, getUnitPriceLabel } from "../utils/vehicleLabels";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("consumption");
  const [exportTarget, setExportTarget] = useState(null);
  const consumptionUnit = getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType);
  const distanceUnit = getOdometerUnit(selectedVehicle?.vehicleType);
  const quantityUnit = getQuantityUnit(selectedVehicle?.vehicleEnergyType);
  const unitPriceLabel = getUnitPriceLabel(selectedVehicle?.vehicleEnergyType);
  const costRateLabel = selectedVehicle?.vehicleType === "agricultural" ? "Coste por hora" : "Coste por 100 km";

  useEffect(() => {
    const controller = new AbortController();
    const loadFuelings = async () => {
      if (!selectedVehicle?.id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await apiFetch(`/api/fuelings/vehicle/${selectedVehicle.id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las estadísticas");
        }

        const data = await response.json();
        setFuelings(data || []);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") return;
        setError(fetchError.message || "Error cargando estadísticas");
      } finally {
        setLoading(false);
      }
    };

    loadFuelings();
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
            borderColor: "#f8fafc",
            backgroundColor: "rgba(248, 250, 252, 0.12)",
            pointBackgroundColor: "#e2e8f0",
            pointBorderColor: "#ffffff",
            pointRadius: 4,
            pointHoverRadius: 6,
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
            pointBorderColor: "#ffffff",
            pointRadius: 4,
            pointHoverRadius: 6,
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
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            pointBackgroundColor: "#6ee7b7",
            pointBorderColor: "#ffffff",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
          },
        ],
      };
    }
  }, [chartFuelings, selectedMetric, consumptionUnit, costRateLabel, unitPriceLabel, selectedVehicle]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(2, 6, 23, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#e2e8f0",
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
            color: "#94a3b8",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
          grid: {
            color: "rgba(148, 163, 184, 0.08)",
          },
        },
        y: {
          beginAtZero: false,
          ticks: {
            color: "#94a3b8",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)",
          },
        },
      },
    }),
    [selectedMetric, consumptionUnit, unitPriceLabel]
  );

  const cards = [
    {
      label: "Consumo medio",
      value: `${metrics.averageConsumption.toFixed(2)} ${consumptionUnit}`,
      note: `Cantidad verificada dividida entre ${distanceUnit === "h" ? "horas" : "kilómetros"} recorridos`,
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
    <section className="space-y-8">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Estadísticas</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Métricas de {selectedVehicle.brand} {selectedVehicle.model}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Resumen rápido del comportamiento del vehículo a partir de sus repostajes.
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setExportTarget({ reportType: "summary", vehicle: selectedVehicle })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-teal-300/40 hover:bg-white/10 hover:text-white"
            aria-label="Exportar resumen"
            title="Exportar resumen"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 py-8 text-center text-slate-400">Cargando estadísticas...</div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card, index) => {
                const cardMetricKey = index === 0 ? "consumption" : index === 1 ? "costPer100Km" : "fuelPrice";
                const isSelected = selectedMetric === cardMetricKey;

                return (
                  <button
                    key={card.label}
                    onClick={() => setSelectedMetric(cardMetricKey)}
                    className={`rounded-3xl border p-5 transition-all ${isSelected
                        ? "border-blue-400/50 bg-blue-500/15"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                  >
                    <p className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                    <p className="mt-3 text-left text-2xl font-semibold text-white">{card.value}</p>
                    <p className="mt-2 text-left text-sm leading-6 text-slate-400">{card.note}</p>
                  </button>
                );
              })}
            </div>

            <article className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Gráfica</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {selectedMetric === "consumption"
                      ? "Consumo medio acumulado"
                      : selectedMetric === "costPer100Km"
                        ? `${costRateLabel} acumulado`
                        : "Precio medio combustible acumulado"}
                  </h3>
                </div>
              </div>

              <div className="mt-5 h-[340px] rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-3 sm:h-[480px] sm:p-4 xl:h-[520px]">
                {chartFuelings.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1rem] border border-dashed border-white/10 text-sm text-slate-400">
                    Todavía no hay datos suficientes para dibujar la gráfica.
                  </div>
                )}
              </div>
            </article>
          </>
        )}
      </article>

      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Últimos repostajes</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Historial reciente</h3>
          </div>
          <p className="text-sm text-slate-400">{fuelings.length} registros</p>
        </div>

        {recentFuelings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            Todavía no hay repostajes para mostrar.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Cantidad</th>
                  <th className="px-4 py-2">Importe</th>
                  <th className="px-4 py-2">Distancia</th>
                  <th className="px-4 py-2">Consumo</th>
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
                    <tr key={fueling.id} className="rounded-2xl bg-white/5 text-sm text-slate-200">
                      <td className="rounded-l-2xl px-4 py-4">{formatFullDate(fueling.date)}</td>
                      <td className="px-4 py-4">{liters.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quantityUnit}</td>
                      <td className="px-4 py-4">{priceTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                      <td className="px-4 py-4">{distance.toLocaleString("es-ES", { maximumFractionDigits: 1 })} {distanceUnit}</td>
                      <td className="rounded-r-2xl px-4 py-4">{consumption !== null ? `${consumption} ${consumptionUnit}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {exportTarget ? (
        <ExportReportModal
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
