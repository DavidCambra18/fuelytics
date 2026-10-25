import { loadRequest } from "../utils/loadRequest";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, CalendarDays, RotateCcw } from "lucide-react";
import { apiFetch } from "../services/api";
import { getConsumptionUnit, getOdometerUnit, getQuantityUnit, getUnitPriceLabel, formatExpenseType } from "../utils/vehicleLabels";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import CustomSelect from "../components/CustomSelect";
import ExportReportModal from "../components/ExportReportModal";
import { buildFuelingRows, summarizeConsumption } from "../utils/consumption";
import { buildStatisticsSeries, selectStatisticsPoints, monthlyConsumption, spendingBreakdown } from "../utils/statistics";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler } from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler);

const number = (value, digits = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(2026, month, 1)));
const expenseColors = { fuel: "#38d8c3", maintenance: "#70a8ed", repair: "#efbe6a", insurance: "#d890a2", tire_change: "#96c5d6", oil: "#82b59c", toll: "#d2b68d", washing: "#6699b8", taxes: "#b5bb8e", inspection: "#d69071", homologation: "#86a0a8", tuning: "#d2a6a1", financing: "#a9bdcc", spare_parts: "#b0c49a", parking: "#b2b8d1", matriculation: "#d0bca8", fines: "#ec8f95", other: "#a3b4c5" };
function formatFullDate(value) {
  if (!value) return "No definida";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export default function Statistics() {
  const { selectedVehicle } = useOutletContext();
  const [fuelings, setFuelings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState("");
  const [expensesAttempt, setExpensesAttempt] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState("consumption");
  const [pointCount, setPointCount] = useState("10");
  const [showDates, setShowDates] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [exportTarget, setExportTarget] = useState(null);
  const expensesRetrying = useRef(false);
  const expensesRetryRef = useRef(null);
  const expensesMetricRef = useRef(null);
  const consumptionUnit = getConsumptionUnit(selectedVehicle.vehicleType, selectedVehicle.vehicleEnergyType);
  const distanceUnit = getOdometerUnit(selectedVehicle.vehicleType);
  const quantityUnit = getQuantityUnit(selectedVehicle.vehicleEnergyType);
  const unitPriceLabel = getUnitPriceLabel(selectedVehicle.vehicleEnergyType);
  const costRateLabel = selectedVehicle.vehicleType === "agricultural" ? "Coste por hora" : "Coste por 100 km";
  const costUnit = selectedVehicle.vehicleType === "agricultural" ? "€/h" : "€/100 km";
  const invalidRange = !!(from && to && from > to);
  const range = useMemo(() => ({ from, to }), [from, to]);

  useEffect(() => {
    const controller = new AbortController();
    loadRequest({
      signal: controller.signal,
      load: async () => {
        const response = await apiFetch(`/api/fuelings/vehicle/${selectedVehicle.id}`, { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudieron cargar las estadísticas");
        return response.json();
      },
      onSuccess: (data) => setFuelings(data || []),
      onError: (failure) => setError(failure.message || "Error cargando estadísticas"),
      onSettled: () => setLoading(false),
    });
    return () => controller.abort();
  }, [selectedVehicle.id]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setExpensesLoading(true);
      setExpensesError("");
      await loadRequest({
        signal: controller.signal,
        load: async () => {
          const response = await apiFetch(`/api/expenses/vehicle/${selectedVehicle.id}`, { signal: controller.signal });
          if (!response.ok) throw new Error("No se pudo cargar el reparto de gastos. Los datos de combustible siguen disponibles.");
          return response.json();
        },
        onSuccess: (data) => setExpenses(data || []),
        onError: (failure) => setExpensesError(failure.message || "No se pudieron cargar los gastos"),
        onSettled: () => setExpensesLoading(false),
      });
    }
    load();
    return () => controller.abort();
  }, [selectedVehicle.id, expensesAttempt]);

  useEffect(() => {
    if (expensesLoading || !expensesRetrying.current) return;
    expensesRetrying.current = false;
    if (selectedMetric === "spending") (expensesError ? expensesRetryRef : expensesMetricRef).current?.focus({ preventScroll: true });
  }, [expensesLoading, expensesError, selectedMetric]);

  const fuelingRows = useMemo(() => buildFuelingRows(fuelings, selectedVehicle.vehicleType), [fuelings, selectedVehicle.vehicleType]);
  const summary = useMemo(() => summarizeConsumption(fuelingRows, selectedVehicle), [fuelingRows, selectedVehicle]);
  const series = useMemo(() => buildStatisticsSeries(fuelingRows, selectedVehicle), [fuelingRows, selectedVehicle]);
  const years = useMemo(() => [...new Set(fuelingRows.map((row) => row.date?.slice(0, 4)).filter(Boolean))].sort().reverse(), [fuelingRows]);
  const year = selectedYear || years[0] || String(new Date().getFullYear());
  const months = useMemo(() => monthlyConsumption(fuelingRows, selectedVehicle, year, range), [fuelingRows, selectedVehicle, year, range]);
  const spending = useMemo(() => spendingBreakdown(fuelings, expenses, range), [fuelings, expenses, range]);
  const points = useMemo(() => selectStatisticsPoints(series[selectedMetric] || [], { count: pointCount, ...range }), [series, selectedMetric, pointCount, range]);
  const isMonthly = selectedMetric === "monthly";
  const isSpending = selectedMetric === "spending";
  const metricInfo = {
    consumption: { label: "Consumo", title: "Consumo medio acumulado", unit: consumptionUnit, digits: 2 },
    fuelPrice: { label: "Precio", title: "Precio medio del combustible acumulado", unit: unitPriceLabel, digits: 3 },
    distance: { label: distanceUnit === "h" ? "Horas de uso" : "Distancia", title: distanceUnit === "h" ? "Horas entre repostajes" : "Distancia entre repostajes", unit: distanceUnit, digits: 1 },
    monthly: { label: "Por mes", title: "Consumo mensual", unit: consumptionUnit, digits: 2 },
    spending: { label: "Gastos", title: "Reparto de gastos", unit: "€", digits: 2 },
    costPer100Km: { label: "Coste", title: `${costRateLabel} acumulado`, unit: costUnit, digits: 2 },
  };
  const active = metricInfo[selectedMetric];
  const hasChartData = isSpending ? spending.categories.length > 0 : isMonthly ? months.some((month) => month.value !== null) : points.length > 0;
  const chartBusy = isSpending && expensesLoading;
  const chartError = isSpending && expensesError;
  const colors = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim();
    return { primary: read("--primary"), foreground: read("--foreground"), muted: read("--muted-foreground"), surface: read("--popover"), border: read("--border-subtle"), font: read("--font-sans") };
  }, []);
  const chartData = isSpending ? {
    labels: spending.categories.map((category) => category.key === "fuel" ? "Combustible" : formatExpenseType(category.key)),
    datasets: [{ data: spending.categories.map((category) => category.amount), backgroundColor: spending.categories.map((category) => expenseColors[category.key] || expenseColors.other), borderColor: colors.surface, borderWidth: 3, hoverOffset: 0 }],
  } : isMonthly ? {
    labels: monthNames.map((name) => name.slice(0, 3)),
    datasets: [{ label: consumptionUnit, data: months.map((month) => month.value), backgroundColor: colors.primary, borderRadius: 5, maxBarThickness: 36 }],
  } : {
    labels: points.map((point) => formatFullDate(point.date)),
    datasets: [{ label: active.unit, data: points.map((point) => point.value), borderColor: colors.primary, backgroundColor: "rgba(56, 216, 195, 0.08)", pointBackgroundColor: colors.primary, pointBorderColor: colors.surface, pointRadius: 3, pointHoverRadius: 5, tension: 0.2, cubicInterpolationMode: "monotone", fill: true }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false, animation: false,
    ...(isSpending ? { cutout: "72%" } : {}),
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.surface, titleColor: colors.foreground, bodyColor: colors.foreground,
        titleFont: { family: colors.font }, bodyFont: { family: colors.font }, padding: 12, displayColors: isSpending,
        callbacks: { label: (context) => `${isSpending ? `${context.label}: ` : ""}${number(Number(context.raw), active.digits)} ${active.unit}${isSpending ? ` · ${number(spending.categories[context.dataIndex].percentage, 1)} %` : ""}` },
      },
    },
    ...(!isSpending ? { scales: {
      x: { ticks: { color: colors.muted, font: { family: colors.font, size: 12 }, maxRotation: 0, maxTicksLimit: 6 }, grid: { display: false } },
      y: { beginAtZero: isMonthly || selectedMetric === "distance", ticks: { color: colors.muted, font: { family: colors.font, size: 12 } }, grid: { color: colors.border } },
    } } : {}),
  };
  const cards = [
    { key: "consumption", label: "Consumo medio", value: summary.verifiedCycles ? `${number(summary.averageConsumption)} ${consumptionUnit}` : "—", note: `${number(summary.verifiedDistance, 0)} ${distanceUnit} · ${number(summary.verifiedQuantity)} ${quantityUnit}` },
    { key: "costPer100Km", label: costRateLabel, value: summary.verifiedCycles ? `${number(summary.costPerUnit)} €` : "—", note: `${number(summary.verifiedPrice)} €` },
    { key: "fuelPrice", label: "Precio medio combustible", value: summary.verifiedCycles ? `${number(summary.averageUnitPrice, 3)} ${unitPriceLabel}` : "—", note: `Media ponderada por la cantidad de ${quantityUnit}` },
  ];
  const recentFuelings = useMemo(() => [...fuelingRows].reverse().slice(0, 5), [fuelingRows]);
  const exportDateRange = useMemo(() => {
    const dates = fuelings.map((fueling) => fueling.date).filter(Boolean).sort();
    return dates.length ? { startDate: dates[0], endDate: dates.at(-1) } : {};
  }, [fuelings]);
  const chartDescription = isSpending ? "Combustible y gastos registrados, sin duplicar el combustible en las categorías. Los porcentajes se calculan sobre el total del periodo."
    : isMonthly ? "Consumo ponderado por la distancia recorrida. Los repostajes parciales se incluyen en el mes del siguiente llenado completo. Un mes sin datos no equivale a consumo cero."
      : selectedMetric === "distance" ? `Diferencia de ${distanceUnit === "h" ? "horas" : "kilómetros"} registrada entre repostajes. No es una estimación de autonomía.`
        : "Media acumulada desde el inicio del historial. Los filtros limitan los puntos visibles, sin reiniciar la media ni modificar los cálculos.";

  return (
    <section className="space-y-6 fl-statistics">
      <Surface as="article" className="fl-workspace">
        <header className="fl-workspace-heading">
          <div><h2 className="fl-page-title">Estadísticas</h2><p className="fl-supporting mt-3">Explora la evolución del consumo y descubre cómo se reparte el coste de tu vehículo.</p></div>
          <Button type="button" variant="outline" disabled={loading || !!error} onClick={() => setExportTarget({ reportType: "summary", vehicle: selectedVehicle })} aria-label="Exportar resumen"><Download aria-hidden="true" />Exportar resumen</Button>
        </header>
        {error ? <div role="alert" className="fl-feedback-error">{error}</div> : null}
        {loading ? <div role="status" className="fl-expense-state">Cargando estadísticas...</div> : !error ? <>
          <div className="fl-statistics-tabs" role="group" aria-label="Métrica de la gráfica">
            {Object.entries(metricInfo).map(([key, info]) => <Button key={key} ref={key === "spending" ? expensesMetricRef : undefined} variant={key === selectedMetric ? "secondary" : "ghost"} aria-pressed={key === selectedMetric} onClick={() => setSelectedMetric(key)}>{info.label}</Button>)}
          </div>
          <section className="fl-statistics-explorer" aria-labelledby="statistics-chart-title">
            <div className="fl-statistics-chart-heading">
              <div><h3 id="statistics-chart-title" className="fl-section-title">{active.title}</h3><p className="fl-supporting mt-1">{active.unit}{isMonthly ? ` · ${year}` : ""}</p>{from || to ? <p className="fl-supporting mt-1">{from ? formatFullDate(from) : "Inicio del historial"} – {to ? formatFullDate(to) : "Último registro"}</p> : null}</div>
              <div className="fl-statistics-tools">
                {isMonthly ? <Field id="statistics-year" label="Año"><CustomSelect id="statistics-year" appearance="atlantic" value={year} onChange={setSelectedYear} options={(years.length ? years : [year]).map((value) => ({ value, label: value }))} /></Field> : !isSpending ? <div className="fl-statistics-count" role="group" aria-label="Últimos puntos de la gráfica">
                  {["10", "20", "50", "all"].map((value) => <Button key={value} size="sm" variant={pointCount === value ? "secondary" : "ghost"} aria-pressed={pointCount === value} aria-label={value === "all" ? "Mostrar todos los puntos" : `Mostrar últimos ${value} puntos`} onClick={() => setPointCount(value)}>{value === "all" ? "Todos" : value}</Button>)}
                </div> : null}
                <Button variant="outline" size="icon" aria-label="Filtrar gráfica por fechas" aria-expanded={showDates} aria-controls="statistics-date-filters" onClick={() => setShowDates((current) => !current)}><CalendarDays aria-hidden="true" /></Button>
              </div>
            </div>
            {showDates ? <div id="statistics-date-filters" className="fl-statistics-dates">
              <Field id="statistics-from" label="Desde"><Input id="statistics-from" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? "statistics-date-error" : undefined} /></Field>
              <Field id="statistics-to" label="Hasta"><Input id="statistics-to" type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? "statistics-date-error" : undefined} /></Field>
              <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }} disabled={!from && !to}><RotateCcw aria-hidden="true" />Limpiar</Button>
            </div> : null}
            {invalidRange ? <p id="statistics-date-error" role="alert" className="fl-feedback-error mt-4">La fecha inicial no puede ser posterior a la final.</p> : chartBusy ? <p role="status" className="fl-expense-state">Cargando reparto de gastos...</p> : chartError ? <div className="py-8"><p role="alert" className="fl-feedback-error">{chartError}</p><Button ref={expensesRetryRef} variant="outline" className="mt-4" onClick={() => { expensesRetrying.current = true; setExpensesAttempt((current) => current + 1); }}>Reintentar gastos</Button></div> : <>
              <div className={`fl-chart-canvas fl-statistics-plot ${isSpending ? "fl-statistics-donut" : ""}`}>
                {hasChartData ? isSpending ? <Doughnut data={chartData} options={chartOptions} role="img" aria-labelledby="statistics-chart-title" aria-describedby="statistics-chart-description" /> : isMonthly ? <Bar data={chartData} options={chartOptions} role="img" aria-labelledby="statistics-chart-title" aria-describedby="statistics-chart-description" /> : <Line data={chartData} options={chartOptions} role="img" aria-labelledby="statistics-chart-title" aria-describedby="statistics-chart-description" /> : <p role="status" className="fl-statistics-empty">{from || to ? "No hay datos suficientes para este periodo. Prueba con otras fechas." : "Todavía no hay datos suficientes para dibujar esta gráfica."}</p>}
              </div>
              {!isMonthly && !isSpending && points.length > 0 ? <div className="fl-statistics-bounds">
                {[points[0], points.at(-1)].map((point, index) => <div key={index}><span>{formatFullDate(point.date)}</span>{point.odometer != null ? <span>{number(point.odometer, distanceUnit === "h" ? 1 : 0)} {distanceUnit}</span> : null}</div>)}
              </div> : null}
              {isSpending && hasChartData ? <p className="fl-statistics-total"><span>Total del periodo</span><strong>{number(spending.total)} €</strong></p> : null}
              <p id="statistics-chart-description" className="fl-supporting mt-4">{chartDescription}</p>
              {isMonthly || isSpending || hasChartData ? <details className="fl-chart-data fl-statistics-data" key={selectedMetric} open={isMonthly || isSpending}>
                <summary>{isMonthly ? "Detalle mensual" : isSpending ? "Gastos por categoría" : "Ver datos de la gráfica"}</summary>
                <table><caption className="sr-only">{active.title}{isMonthly ? ` de ${year}` : ""}</caption>
                  <thead><tr><th scope="col">{isMonthly ? "Mes" : isSpending ? "Categoría" : "Fecha"}</th>{isSpending ? <th scope="col">Porcentaje</th> : null}<th scope="col">{isSpending ? "Importe (€)" : active.unit}</th></tr></thead>
                  <tbody>{isMonthly ? months.map((month) => <tr key={month.month}><th scope="row" className="capitalize">{monthNames[month.month]}</th><td>{month.value == null ? <span aria-label="Sin datos suficientes">—</span> : number(month.value)}</td></tr>) : isSpending ? spending.categories.map((category) => <tr key={category.key}><th scope="row"><span className="fl-statistics-category"><span className="fl-statistics-swatch" style={{ backgroundColor: expenseColors[category.key] || expenseColors.other }} aria-hidden="true" />{category.key === "fuel" ? "Combustible" : formatExpenseType(category.key)}</span></th><td>{number(category.percentage, 1)} %</td><td>{number(category.amount)}</td></tr>) : points.map((point) => <tr key={point.id}><th scope="row">{formatFullDate(point.date)}</th><td>{number(point.value, active.digits)}</td></tr>)}</tbody>
                </table>
              </details> : null}
            </>}
          </section>
          <section className="fl-statistics-summary" aria-labelledby="statistics-summary-title">
            <div className="mb-4"><h3 id="statistics-summary-title" className="fl-section-title">Resumen de todo el historial</h3><p className="fl-supporting mt-2">Los filtros de la gráfica no cambian este resumen ni la exportación.</p></div>
            <div className="fl-metric-selector">
              {cards.map((card) => <button key={card.key} onClick={() => setSelectedMetric(card.key)} type="button" aria-pressed={selectedMetric === card.key} className="fl-metric-choice"><span className="fl-metric-label">{card.label}</span><span className="fl-metric-value">{card.value}</span><span className="fl-supporting mt-2">{card.note}</span></button>)}
            </div>
          </section>
        </> : null}
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
