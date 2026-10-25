export function tripEstimate({ distance, fuelPrice, people, consumption }) {
  const values = { distance, fuelPrice, people, consumption };
  const errors = {};
  for (const [field, value] of Object.entries(values)) {
    if (value === "" || value == null) continue;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) errors[field] = "Introduce un número válido, igual o mayor que cero.";
    if (field === "people" && (!Number.isSafeInteger(number) || number < 1)) errors.people = "Introduce un número entero de personas, como mínimo una.";
  }
  const complete = Object.values(values).every((value) => value !== "" && value != null);
  const estimatedLiters = Number(distance) * Number(consumption) / 100;
  const totalCost = estimatedLiters * Number(fuelPrice);
  if (complete && (!Number.isFinite(totalCost) || !Number.isFinite(estimatedLiters))) errors.distance = "Los valores introducidos son demasiado grandes.";
  const valid = complete && Object.keys(errors).length === 0;
  return { errors, valid, estimatedLiters: valid ? estimatedLiters : null, totalCost: valid ? totalCost : null,
    costPerPerson: valid ? totalCost / Number(people) : null };
}
