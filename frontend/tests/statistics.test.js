import test from "node:test";
import assert from "node:assert/strict";
import { buildFuelingRows, summarizeConsumption } from "../src/utils/consumption.js";
import { buildStatisticsSeries, selectStatisticsPoints, monthlyConsumption, spendingBreakdown } from "../src/utils/statistics.js";

const vehicle = { vehicleType: "car", vehicleEnergyType: "diesel" };
const fueling = (id, date, distance, liters, priceTotal, refueling = "complete", fuelType = "diesel") => ({ id, date, distance, liters, priceTotal, refueling, fuelType, odometer: 1000 + distance });

test("las curvas acumuladas conservan las mismas fórmulas del resumen verificado", () => {
  const entries = [fueling(1, "2026-01-01", 0, 40, 60, "initial"), fueling(2, "2026-01-10", 200, 15, 24, "partial"), fueling(3, "2026-02-01", 400, 30, 48), fueling(4, "2026-02-10", 500, 40, 64)];
  const rows = buildFuelingRows(entries, "car");
  const series = buildStatisticsSeries(rows, vehicle);
  const summary = summarizeConsumption(rows, vehicle);
  assert.equal(series.consumption.length, 2);
  assert.equal(series.consumption.at(-1).value, summary.averageConsumption);
  assert.equal(series.costPer100Km.at(-1).value, summary.costPerUnit);
  assert.equal(series.fuelPrice.at(-1).value, summary.averageUnitPrice);
  assert.deepEqual(series.distance.map((point) => point.value), [200, 400, 500]);
});

test("el consumo mensual se pondera por distancia, no por número de repostajes", () => {
  const rows = buildFuelingRows([fueling(1, "2026-01-01", 0, 40, 60, "initial"), fueling(2, "2026-01-10", 100, 10, 16), fueling(3, "2026-01-20", 900, 45, 72)], "car");
  const months = monthlyConsumption(rows, vehicle, "2026");
  assert.equal(months[0].value, 5.5);
  assert.equal(months[0].distance, 1000);
  assert.equal(months[0].cycles, 2);
  assert.equal(months[1].value, null);
  assert.equal(months.length, 12);
});

test("un ciclo conserva sus parciales anteriores y se asigna al mes de cierre", () => {
  const rows = buildFuelingRows([fueling(1, "2025-12-01", 0, 40, 60, "initial"), fueling(2, "2025-12-20", 200, 20, 32, "partial"), fueling(3, "2026-01-15", 300, 25, 40)], "car");
  const month = monthlyConsumption(rows, vehicle, "2026", { from: "2026-01-01", to: "2026-01-31" })[0];
  assert.equal(month.value, 9);
  assert.equal(month.distance, 500);
  assert.equal(month.quantity, 45);
  assert.equal(monthlyConsumption(rows, vehicle, "2025")[11].value, null);
});

test("los filtros limitan los puntos sin reiniciar las medias ni alterar el historial", () => {
  const points = Array.from({ length: 30 }, (_, index) => ({ id: index, date: `2026-01-${String(index + 1).padStart(2, "0")}`, value: index }));
  const original = structuredClone(points);
  assert.equal(selectStatisticsPoints(points).length, 10);
  assert.equal(selectStatisticsPoints(points, { count: "20" })[0].id, 10);
  assert.equal(selectStatisticsPoints(points, { count: "all" }).length, 30);
  assert.deepEqual(selectStatisticsPoints(points, { count: "all", from: "2026-01-15", to: "2026-01-17" }).map((point) => point.id), [14, 15, 16]);
  assert.equal(selectStatisticsPoints(points, { from: "2026-02-01", to: "2026-01-01" }).length, 0);
  assert.deepEqual(points, original);
});

test("los híbridos no mezclan electricidad con combustible ni duplican puntos de consumo", () => {
  const rows = buildFuelingRows([fueling(1, "2026-01-01", 0, 40, 60, "initial", "gasoline_95"), fueling(2, "2026-01-02", 100, 20, 5, "initial", "electricity"), fueling(3, "2026-01-03", 600, 36, 54, "complete", "gasoline_95"), fueling(4, "2026-01-04", 200, 40, 10, "complete", "electricity")], "car");
  const hybrid = { vehicleType: "car", vehicleEnergyType: "plug_in_hybrid_gasoline" };
  assert.deepEqual(buildStatisticsSeries(rows, hybrid).consumption.map((point) => point.value), [6]);
  assert.equal(monthlyConsumption(rows, hybrid, 2026)[0].value, 6);
  assert.equal(spendingBreakdown(rows, []).total, 129);
});

test("electricidad, gas e implementos agrícolas mantienen sus unidades y factores", () => {
  for (const [energy, fuel] of [["electric", "electricity"], ["gnc", "gnc"], ["hydrogen", "hydrogen"]]) {
    const v = { vehicleType: "agricultural", vehicleEnergyType: energy };
    const rows = buildFuelingRows([fueling(1, "2026-01-01", 0, 20, 30, "initial", fuel), fueling(2, "2026-01-02", 5, 15, 22.5, "complete", fuel)], v.vehicleType);
    assert.equal(buildStatisticsSeries(rows, v).consumption[0].value, 3);
    assert.equal(monthlyConsumption(rows, v, "2026")[0].value, 3);
  }
});

test("el desglose incluye combustible y cada categoría una sola vez y suma en céntimos", () => {
  const fuelings = [fueling(1, "2026-01-01", 0, 1, 0.1), fueling(2, "2026-01-02", 1, 1, 0.2)];
  const expenses = [{ type: "maintenance", date: "2026-01-03", cost: "10.25" }, { type: "repair", date: "2026-01-04", cost: 5 }, { type: "repair", date: "2026-01-05", cost: 5 }];
  const result = spendingBreakdown(fuelings, expenses);
  assert.equal(result.total, 20.55);
  assert.deepEqual(result.categories.map((category) => [category.key, category.amount]), [["maintenance", 10.25], ["repair", 10], ["fuel", 0.3]]);
  assert.ok(Math.abs(result.categories.reduce((sum, category) => sum + category.percentage, 0) - 100) < 1e-10);
  assert.equal(spendingBreakdown(fuelings, expenses, { from: "2026-01-03", to: "2026-01-03" }).total, 10.25);
});

test("sin datos no se fabrican consumos, porcentajes ni categorías", () => {
  assert.deepEqual(spendingBreakdown([], []), { total: 0, categories: [] });
  assert.deepEqual(buildStatisticsSeries([], vehicle), { consumption: [], costPer100Km: [], fuelPrice: [], distance: [] });
  assert.ok(monthlyConsumption([], vehicle, "2026").every((month) => month.value === null));
});
