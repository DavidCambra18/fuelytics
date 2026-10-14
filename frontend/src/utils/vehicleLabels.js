const VEHICLE_ENERGY_TYPE_LABELS = {
  gasoline: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid_gasoline: "Híbrido gasolina",
  hybrid_diesel: "Híbrido diésel",
  plug_in_hybrid_gasoline: "Híbrido enchufable gasolina",
  plug_in_hybrid_diesel: "Híbrido enchufable diésel",
  glp: "GLP",
  gnc: "GNC",
  hydrogen: "Hidrógeno",
  ethanol: "Etanol",
};

const VEHICLE_TYPE_LABELS = {
  car: "Coche",
  bike: "Moto",
  van: "Furgoneta",
  truck: "Camión",
  quad: "Quad",
  agricultural: "Agrícola",
};

const FUEL_TYPE_LABELS = {
  gasoline_95: "Gasolina 95",
  gasoline_98: "Gasolina 98",
  diesel: "Diésel",
  diesel_premium: "Diésel premium",
  biodiesel: "Biodiésel",
  electricity: "Electricidad",
  e85: "E85",
  glp: "GLP",
  gnc: "GNC",
  hydrogen: "Hidrógeno",
};

const GEARBOX_LABELS = {
  torque_converter: "Convertidor de par",
  dual_clutch: "Doble embrague",
  semi_automatic: "Semi-automática",
  cvt: "CVT",
  automatic: "Automática",
  manual: "Manual",
};

const REFUELING_TYPE_LABELS = {
  complete: "Repostaje completo",
  partial: "Repostaje parcial",
  initial: "Repostaje inicial",
};

const DRIVING_TYPE_LABELS = {
  slow: "Conducción lenta",
  normal: "Conducción normal",
  fast: "Conducción rápida",
};

const TIRE_TYPE_LABELS = {
  summer: "Neumáticos de verano",
  winter: "Neumáticos de invierno",
  allseason: "Neumáticos 4 estaciones",
};

const TIRE_AXLE_LABELS = {
  FRONT: "Delanteros",
  REAR: "Traseros",
};

export const VEHICLE_ENERGY_TYPE_OPTIONS = [
  { value: "gasoline", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electric", label: "Eléctrico" },
  { value: "hybrid_gasoline", label: "Híbrido gasolina" },
  { value: "hybrid_diesel", label: "Híbrido diésel" },
  { value: "plug_in_hybrid_gasoline", label: "Híbrido enchufable gasolina" },
  { value: "plug_in_hybrid_diesel", label: "Híbrido enchufable diésel" },
  { value: "glp", label: "GLP" },
  { value: "gnc", label: "GNC" },
  { value: "hydrogen", label: "Hidrógeno" },
  { value: "ethanol", label: "Etanol" },
];

export const VEHICLE_TYPE_OPTIONS = [
  { value: "car", label: "Coche" },
  { value: "bike", label: "Moto" },
  { value: "van", label: "Furgoneta" },
  { value: "truck", label: "Camión" },
  { value: "quad", label: "Quad" },
  { value: "agricultural", label: "Agrícola" },
];

export const FUEL_TYPE_OPTIONS = [
  { value: "gasoline_95", label: "Gasolina 95" },
  { value: "gasoline_98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel premium" },
  { value: "biodiesel", label: "Biodiésel" },
  { value: "electricity", label: "Electricidad" },
  { value: "e85", label: "E85" },
  { value: "glp", label: "GLP" },
  { value: "gnc", label: "GNC" },
  { value: "hydrogen", label: "Hidrógeno" },
];

export const GEARBOX_OPTIONS = [
  { value: "torque_converter", label: "Convertidor de par" },
  { value: "dual_clutch", label: "Doble embrague" },
  { value: "semi_automatic", label: "Semi-automática" },
  { value: "cvt", label: "CVT" },
  { value: "automatic", label: "Automática" },
  { value: "manual", label: "Manual" },
];

export const REFUELING_TYPE_OPTIONS = [
  { value: "complete", label: "Repostaje completo" },
  { value: "partial", label: "Repostaje parcial" },
  { value: "initial", label: "Repostaje inicial" },
];

export const DRIVING_TYPE_OPTIONS = [
  { value: "slow", label: "Conducción lenta" },
  { value: "normal", label: "Conducción normal" },
  { value: "fast", label: "Conducción rápida" },
];

export const TIRE_TYPE_OPTIONS = [
  { value: "summer", label: "Neumáticos de verano" },
  { value: "winter", label: "Neumáticos de invierno" },
  { value: "allseason", label: "Neumáticos 4 estaciones" },
];

export const TIRE_AXLE_OPTIONS = [
  { value: "FRONT", label: "Delanteros" },
  { value: "REAR", label: "Traseros" },
];

const EXPENSE_TYPE_LABELS = {
  maintenance: "Mantenimiento",
  repair: "Reparación",
  insurance: "Seguro",
  fines: "Multas",
  oil: "Aceite",
  toll: "Peaje",
  washing: "Lavado",
  taxes: "Impuestos",
  inspection: "ITV",
  homologation: "Homologación",
  tuning: "Tuning",
  tire_change: "Cambio de neumáticos",
  financing: "Financiación",
  spare_parts: "Repuestos",
  parking: "Parking",
  matriculation: "Matriculación"
};

function toReadableLabel(value) {
  if (!value) {
    return "No definido";
  }

  return value
    .toString()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatVehicleEnergyType(value) {
  return VEHICLE_ENERGY_TYPE_LABELS[value] || toReadableLabel(value);
}

export function formatVehicleType(value) {
  return VEHICLE_TYPE_LABELS[value] || toReadableLabel(value);
}

export function formatFuelType(value) {
  return FUEL_TYPE_LABELS[value] || toReadableLabel(value);
}

export function formatGearboxType(value) {
  return GEARBOX_LABELS[value] || toReadableLabel(value);
}

export function formatRefuelingType(value) {
  return REFUELING_TYPE_LABELS[value] || toReadableLabel(value);
}

export function formatDrivingType(value) {
  return DRIVING_TYPE_LABELS[value] || toReadableLabel(value);
}

export function formatTireType(value) {
  return TIRE_TYPE_LABELS[value] || toReadableLabel(value);
}

export function formatTireAxle(value) {
  return TIRE_AXLE_LABELS[value] || toReadableLabel(value);
}

export function formatExpenseType(value) {
  return EXPENSE_TYPE_LABELS[value] || toReadableLabel(value);
}

export function getConsumptionUnit(vehicleType, vehicleEnergyType) {
  if (vehicleType === "agricultural") {
    if (vehicleEnergyType === "electric") return "kWh/h";
    if (vehicleEnergyType === "hydrogen" || vehicleEnergyType === "gnc") return "kg/h";
    return "L/h";
  }
  if (vehicleEnergyType === "electric") {
    return "kWh/100km";
  }
  if (vehicleEnergyType === "hydrogen" || vehicleEnergyType === "gnc") {
    return "kg/100km";
  }
  return "L/100km";
}

export function getQuantityUnit(vehicleEnergyType) {
  if (vehicleEnergyType === "electric") return "kWh";
  if (vehicleEnergyType === "hydrogen" || vehicleEnergyType === "gnc") return "kg";
  return "L";
}

export function getQuantityUnitForFuel(fuelType) {
  if (fuelType === "electricity") return "kWh";
  if (fuelType === "hydrogen" || fuelType === "gnc") return "kg";
  return "L";
}

export function getUnitPriceLabel(vehicleEnergyType) {
  return `€/${getQuantityUnit(vehicleEnergyType)}`;
}

export function getDefaultFuelType(vehicleEnergyType) {
  const defaults = {
    gasoline: "gasoline_95",
    diesel: "diesel",
    electric: "electricity",
    hybrid_gasoline: "gasoline_95",
    hybrid_diesel: "diesel",
    plug_in_hybrid_gasoline: "gasoline_95",
    plug_in_hybrid_diesel: "diesel",
    glp: "glp",
    gnc: "gnc",
    hydrogen: "hydrogen",
    ethanol: "e85",
  };
  return defaults[vehicleEnergyType] || "diesel";
}

export function getFuelOptionsForEnergy(vehicleEnergyType) {
  const allowed = {
    gasoline: ["gasoline_95", "gasoline_98"],
    diesel: ["diesel", "diesel_premium", "biodiesel"],
    electric: ["electricity"],
    hybrid_gasoline: ["gasoline_95", "gasoline_98"],
    hybrid_diesel: ["diesel", "diesel_premium", "biodiesel"],
    plug_in_hybrid_gasoline: ["gasoline_95", "gasoline_98", "electricity"],
    plug_in_hybrid_diesel: ["diesel", "diesel_premium", "biodiesel", "electricity"],
    glp: ["glp", "gasoline_95", "gasoline_98"],
    gnc: ["gnc", "gasoline_95", "gasoline_98"],
    hydrogen: ["hydrogen"],
    ethanol: ["e85", "gasoline_95", "gasoline_98"],
  };
  const values = allowed[vehicleEnergyType] || [];
  return FUEL_TYPE_OPTIONS.filter((option) => values.includes(option.value));
}

export function getOdometerLabel(vehicleType) {
  return vehicleType === "agricultural" ? "Horometro" : "Odómetro";
}

export function getOdometerUnit(vehicleType) {
  return vehicleType === "agricultural" ? "h" : "km";
}
