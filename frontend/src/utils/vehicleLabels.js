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
  allseason: "Neumáticos todo terreno",
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
  { value: "allseason", label: "Neumáticos todo terreno" },
];

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