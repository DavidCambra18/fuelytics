import test from "node:test";
import assert from "node:assert/strict";

import { buildFuelingRows, summarizeConsumption } from "../src/utils/consumption.js";

test("calcula únicamente ciclos cerrados entre llenados completos", () => {
  const rows = buildFuelingRows([
    fueling(1, "2026-01-01", "initial", "diesel", 0, 45, 72),
    fueling(2, "2026-01-15", "partial", "diesel", 300, 20, 32),
    fueling(3, "2026-02-01", "complete", "diesel", 500, 40, 64),
    fueling(4, "2026-02-10", "partial", "diesel", 100, 10, 16),
  ], "car");

  const summary = summarizeConsumption(rows, {
    vehicleEnergyType: "diesel",
    vehicleType: "car",
  });

  assert.equal(summary.verifiedCycles, 1);
  assert.equal(summary.verifiedDistance, 800);
  assert.equal(summary.verifiedQuantity, 60);
  assert.equal(summary.averageConsumption, 7.5);
  assert.equal(summary.costPerUnit, 12);
});

test("separa electricidad y combustible en vehículos híbridos enchufables", () => {
  const rows = buildFuelingRows([
    fueling(1, "2026-01-01", "initial", "gasoline_95", 0, 40, 60),
    fueling(2, "2026-01-05", "complete", "electricity", 100, 20, 5),
    fueling(3, "2026-01-10", "complete", "gasoline_95", 600, 36, 54),
  ], "car");

  const summary = summarizeConsumption(rows, {
    vehicleEnergyType: "plug_in_hybrid_gasoline",
    vehicleType: "car",
  });

  assert.equal(summary.measurement, "liquid");
  assert.equal(summary.verifiedCycles, 1);
  assert.equal(summary.verifiedDistance, 600);
  assert.equal(summary.averageConsumption, 6);
});

test("usa consumo por hora en vehículos agrícolas", () => {
  const rows = buildFuelingRows([
    fueling(1, "2026-01-01", "complete", "diesel", 0, 20, 30),
    fueling(2, "2026-01-02", "complete", "diesel", 5, 15, 22.5),
  ], "agricultural");

  const summary = summarizeConsumption(rows, {
    vehicleEnergyType: "diesel",
    vehicleType: "agricultural",
  });

  assert.equal(summary.averageConsumption, 3);
  assert.equal(summary.costPerUnit, 4.5);
});

function fueling(id, date, refueling, fuelType, distance, liters, priceTotal) {
  return { id, date, refueling, fuelType, distance, liters, priceTotal };
}
