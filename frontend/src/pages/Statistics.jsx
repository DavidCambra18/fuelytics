import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { API_BASE } from "../config/api";
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

  useEffect(() => {
    const loadFuelings = async () => {
      if (!selectedVehicle?.id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE}/api/fuelings/vehicle/${selectedVehicle.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar las estadísticas");
        }

        const data = await response.json();
        setFuelings(data || []);
      } catch (fetchError) {
        setError(fetchError.message || "Error cargando estadísticas");
      } finally {
        setLoading(false);
      }
    };

    loadFuelings();
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

  const metrics = useMemo(() => {
    const totalDistance = fuelings.reduce((acc, fueling) => acc + Number(fueling.distance || 0), 0);
    const totalLiters = fuelings.reduce((acc, fueling) => acc + Number(fueling.liters || 0), 0);
    const totalPrice = fuelings.reduce((acc, fueling) => acc + Number(fueling.priceTotal || 0), 0);
    const totalEntries = fuelings.length;
    const averageConsumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;
    const costPer100Km = totalDistance > 0 ? (totalPrice / totalDistance) * 100 : 0;
    const averageFuelPrice = totalLiters > 0 ? totalPrice / totalLiters : 0;
    const averageDistance = totalEntries > 0 ? totalDistance / totalEntries : 0;

    return {
      totalDistance,
      totalLiters,
      totalPrice,
      totalEntries,
      averageConsumption,
      costPer100Km,
      averageFuelPrice,
      averageDistance,
    };
  }, [fuelings]);

  const chartData = useMemo(() => {
    if (selectedMetric === "consumption") {
      return {
        labels: chartFuelings.map((fueling) => formatDateLabel(fueling.date)),
        datasets: [
          {
            label: "Media acumulada (L/100km)",
            data: chartFuelings.map((_, index) => {
              const subset = chartFuelings.slice(0, index + 1);
              const subsetDistance = subset.reduce((acc, fueling) => acc + Number(fueling.distance || 0), 0);
              const subsetLiters = subset.reduce((acc, fueling) => acc + Number(fueling.liters || 0), 0);

              return subsetDistance > 0 ? (subsetLiters / subsetDistance) * 100 : 0;
            }),
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
        labels: chartFuelings.map((fueling) => formatDateLabel(fueling.date)),
        datasets: [
          {
            label: "Coste por 100km (€)",
            data: chartFuelings.map((_, index) => {
              const subset = chartFuelings.slice(0, index + 1);
              const subsetDistance = subset.reduce((acc, fueling) => acc + Number(fueling.distance || 0), 0);
              const subsetPrice = subset.reduce((acc, fueling) => acc + Number(fueling.priceTotal || 0), 0);

              return subsetDistance > 0 ? (subsetPrice / subsetDistance) * 100 : 0;
            }),
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
        labels: chartFuelings.map((fueling) => formatDateLabel(fueling.date)),
        datasets: [
          {
            label: "Precio medio combustible (€/L)",
            data: chartFuelings.map((_, index) => {
              const subset = chartFuelings.slice(0, index + 1);
              const subsetPrice = subset.reduce((acc, fueling) => acc + Number(fueling.priceTotal || 0), 0);
              const subsetLiters = subset.reduce((acc, fueling) => acc + Number(fueling.liters || 0), 0);

              return subsetLiters > 0 ? subsetPrice / subsetLiters : 0;
            }),
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
  }, [chartFuelings, selectedMetric]);

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
                return `${Number(context.raw || 0).toFixed(2)} L/100km`;
              } else if (selectedMetric === "costPer100Km") {
                return `${Number(context.raw || 0).toFixed(2)} €`;
              } else if (selectedMetric === "fuelPrice") {
                return `${Number(context.raw || 0).toFixed(3)} €/L`;
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
    [selectedMetric]
  );

  const cards = [
    {
      label: "Consumo medio",
      value: `${metrics.averageConsumption.toFixed(2)} L/100km`,
      note: "Litros totales divididos entre kilómetros recorridos",
    },
    {
      label: "Coste por 100km",
      value: `${metrics.costPer100Km.toFixed(2)} €`,
      note: "Coste estimado por cada 100 kilómetros",
    },
    {
      label: "Precio medio combustible",
      value: `${metrics.averageFuelPrice.toFixed(3)} €/L`,
      note: "Precio medio pagado por litro",
    },
  ];

  const recentFuelings = fuelings.slice(0, 5);

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
                    className={`rounded-3xl border p-5 transition-all ${
                      isSelected
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
                        ? "Coste por 100km acumulado"
                        : "Precio medio combustible acumulado"}
                  </h3>
                </div>
              </div>

              <div className="mt-5 h-[420px] rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-3 sm:h-[480px] sm:p-4 xl:h-[520px]">
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
                  <th className="px-4 py-2">Litros</th>
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
                  const consumption = distance > 0 ? ((liters / distance) * 100).toFixed(2) : "0.00";

                  return (
                    <tr key={fueling.id} className="rounded-2xl bg-white/5 text-sm text-slate-200">
                      <td className="rounded-l-2xl px-4 py-4">{formatFullDate(fueling.date)}</td>
                      <td className="px-4 py-4">{liters.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</td>
                      <td className="px-4 py-4">{priceTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                      <td className="px-4 py-4">{distance.toLocaleString("es-ES", { maximumFractionDigits: 1 })} km</td>
                      <td className="rounded-r-2xl px-4 py-4">{consumption} L/100km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
