const ELECTRIC_FUELS = new Set(["electricity"]);
const HYDROGEN_FUELS = new Set(["hydrogen"]);
const MASS_FUELS = new Set(["gnc"]);

export function getFuelMeasurement(fuelType) {
  if (ELECTRIC_FUELS.has(fuelType)) return "electricity";
  if (HYDROGEN_FUELS.has(fuelType)) return "hydrogen";
  if (MASS_FUELS.has(fuelType)) return "mass";
  return "liquid";
}

export function getVehicleMeasurement(vehicleEnergyType) {
  if (vehicleEnergyType === "electric") return "electricity";
  if (vehicleEnergyType === "hydrogen") return "hydrogen";
  if (vehicleEnergyType === "gnc") return "mass";
  return "liquid";
}

export function getConsumptionFactor(vehicleType) {
  return vehicleType === "agricultural" ? 1 : 100;
}

export function buildFuelingRows(fuelings, vehicleType) {
  const sortedFuelings = [...fuelings].sort((left, right) => {
    const leftDate = new Date(`${left.date}T00:00:00`).getTime();
    const rightDate = new Date(`${right.date}T00:00:00`).getTime();
    return leftDate !== rightDate ? leftDate - rightDate : Number(left.id || 0) - Number(right.id || 0);
  });
  const factor = getConsumptionFactor(vehicleType);
  const states = new Map();

  return sortedFuelings.map((fueling) => {
    const measurement = getFuelMeasurement(fueling.fuelType);
    const state = states.get(measurement) || {
      hasBaseline: false,
      distance: 0,
      quantity: 0,
      price: 0,
    };
    const quantity = Number(fueling.liters || 0);
    const distance = Number(fueling.distance || 0);
    const priceTotal = Number(fueling.priceTotal || 0);

    if (fueling.refueling === "initial" || (!state.hasBaseline && fueling.refueling === "complete")) {
      states.set(measurement, { hasBaseline: true, distance: 0, quantity: 0, price: 0 });
      return { ...fueling, measurement, displayState: "start", displayConsumption: null };
    }

    if (!state.hasBaseline) {
      return { ...fueling, measurement, displayState: "partial", displayConsumption: null };
    }

    state.distance += distance;
    state.quantity += quantity;
    state.price += priceTotal;

    if (fueling.refueling === "complete" && state.distance > 0) {
      const row = {
        ...fueling,
        measurement,
        displayState: "verified",
        displayConsumption: (state.quantity / state.distance) * factor,
        displayPricePerLiter: state.quantity > 0 ? state.price / state.quantity : null,
        verifiedDistance: state.distance,
        verifiedQuantity: state.quantity,
        verifiedPrice: state.price,
      };
      states.set(measurement, { hasBaseline: true, distance: 0, quantity: 0, price: 0 });
      return row;
    }

    states.set(measurement, state);
    return {
      ...fueling,
      measurement,
      displayState: "estimated",
      displayConsumption: state.distance > 0 ? (state.quantity / state.distance) * factor : null,
    };
  });
}

export function summarizeConsumption(rows, vehicle) {
  const measurement = getVehicleMeasurement(vehicle?.vehicleEnergyType);
  const verifiedRows = rows.filter(
    (row) => row.displayState === "verified" && row.measurement === measurement
  );
  const verifiedDistance = verifiedRows.reduce((sum, row) => sum + Number(row.verifiedDistance || 0), 0);
  const verifiedQuantity = verifiedRows.reduce((sum, row) => sum + Number(row.verifiedQuantity || 0), 0);
  const verifiedPrice = verifiedRows.reduce((sum, row) => sum + Number(row.verifiedPrice || 0), 0);
  const factor = getConsumptionFactor(vehicle?.vehicleType);

  return {
    measurement,
    verifiedCycles: verifiedRows.length,
    verifiedDistance,
    verifiedQuantity,
    verifiedPrice,
    averageConsumption: verifiedDistance > 0 ? (verifiedQuantity / verifiedDistance) * factor : 0,
    costPerUnit: verifiedDistance > 0 ? (verifiedPrice / verifiedDistance) * factor : 0,
    averageUnitPrice: verifiedQuantity > 0 ? verifiedPrice / verifiedQuantity : 0,
  };
}
