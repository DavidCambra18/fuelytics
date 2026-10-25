import { getConsumptionFactor, getVehicleMeasurement } from "./consumption.js";

// Rows are built from the complete history before any date window is applied.
// A partial fill preceding the window still belongs to the cycle it closes.
export function buildStatisticsSeries(rows, vehicle) {
  const measurement = getVehicleMeasurement(vehicle?.vehicleEnergyType);
  const factor = getConsumptionFactor(vehicle?.vehicleType);
  const series = { consumption: [], costPer100Km: [], fuelPrice: [], distance: [] };
  let distance = 0;
  let quantity = 0;
  let price = 0;
  for (const row of rows) {
    if (row.measurement !== measurement) continue;
    const point = { id: row.id, date: row.date, odometer: row.odometer ?? null };
    if (row.refueling !== "initial" && Number(row.distance) > 0) {
      series.distance.push({ ...point, value: Number(row.distance) });
    }
    if (row.displayState !== "verified") continue;
    distance += Number(row.verifiedDistance || 0);
    quantity += Number(row.verifiedQuantity || 0);
    price += Number(row.verifiedPrice || 0);
    series.consumption.push({ ...point, value: distance > 0 ? quantity / distance * factor : 0 });
    series.costPer100Km.push({ ...point, value: distance > 0 ? price / distance * factor : 0 });
    series.fuelPrice.push({ ...point, value: quantity > 0 ? price / quantity : 0 });
  }
  return series;
}

export function isWithinDates(date, from = "", to = "") {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && (!from || date >= from) && (!to || date <= to);
}

export function selectStatisticsPoints(points, { count = "10", from = "", to = "" } = {}) {
  const filtered = points.filter((point) => isWithinDates(point.date, from, to));
  return count === "all" ? filtered : filtered.slice(-Math.max(1, Number(count) || 10));
}

export function monthlyConsumption(rows, vehicle, year, range = {}) {
  const measurement = getVehicleMeasurement(vehicle?.vehicleEnergyType);
  const factor = getConsumptionFactor(vehicle?.vehicleType);
  const months = Array.from({ length: 12 }, (_, month) => ({ month, distance: 0, quantity: 0, cycles: 0, value: null }));
  for (const row of rows) {
    if (row.displayState !== "verified" || row.measurement !== measurement
      || !isWithinDates(row.date, range.from, range.to) || row.date.slice(0, 4) !== String(year)) continue;
    const month = months[Number(row.date.slice(5, 7)) - 1];
    if (!month) continue;
    month.distance += Number(row.verifiedDistance || 0);
    month.quantity += Number(row.verifiedQuantity || 0);
    month.cycles += 1;
  }
  return months.map((month) => ({ ...month, value: month.distance > 0 ? month.quantity / month.distance * factor : null }));
}

export function spendingBreakdown(fuelings, expenses, range = {}) {
  const totals = new Map();
  const add = (key, amount) => {
    const cents = Math.round(Number(amount || 0) * 100);
    if (Number.isFinite(cents) && cents > 0) totals.set(key, (totals.get(key) || 0) + cents);
  };
  for (const fueling of fuelings) if (isWithinDates(fueling.date, range.from, range.to)) add("fuel", fueling.priceTotal);
  for (const expense of expenses) if (isWithinDates(expense.date, range.from, range.to)) add(expense.type || "other", expense.cost);
  const totalCents = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const categories = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, cents]) => ({ key, amount: cents / 100, percentage: cents / totalCents * 100 }));
  return { total: totalCents / 100, categories };
}
