import { tripEstimate } from "../utils/tripEstimate";
import { useState } from "react";
import { MapPin, Fuel, Users, Droplets, Gauge } from "lucide-react";

import { Surface } from "./ui/surface";
import { Input } from "./ui/field";

export default function TripCalculator() {
  const [distance, setDistance] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [people, setPeople] = useState(1);
  const [consumption, setConsumption] = useState("");

  const { errors, valid, estimatedLiters, totalCost, costPerPerson } = tripEstimate({ distance, fuelPrice, people, consumption });
  const fieldProps = (field) => ({ "aria-invalid": !!errors[field], "aria-describedby": errors[field] ? `trip-${field}-error` : undefined });
  const fieldError = (field) => errors[field] && <p id={`trip-${field}-error`} className="mt-2 text-sm text-destructive" role="alert">{errors[field]}</p>;
  const result = (value, unit) => valid ? `${value.toFixed(2)} ${unit}` : "—";

  return (
    <section className="section-shell space-y-6 pb-10">
      <Surface as="article" className="fl-workspace fl-calculator mx-auto max-w-5xl">
        <header className="fl-workspace-heading"><div>
          <h1 className="fl-page-title">Calculadora de viaje</h1>
          <p className="fl-supporting mt-3">Estima el coste de tu próximo trayecto y divide los gastos fácilmente.</p>
        </div></header>

        <div className="fl-calculator-layout">
          <div className="fl-calculator-fields">
            <div className="grid gap-4">
              <div>
                <label htmlFor="trip-consumption" className="fl-label mb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
                  Consumo (L/100 km)
                </label>
                <Input
                  id="trip-consumption"
                  {...fieldProps("consumption")}
                  type="number"
                  min="0"
                  step="0.1"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  placeholder="Ej: 6.5"
                />
                {fieldError("consumption")}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="trip-distance" className="fl-label mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                  Distancia (km)
                </label>
                <Input
                  id="trip-distance"
                  {...fieldProps("distance")}
                  type="number"
                  min="0"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Ej: 450"
                />
                {fieldError("distance")}
              </div>
              <div>
                <label htmlFor="trip-fuel-price" className="fl-label mb-2 flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-primary" aria-hidden="true" />
                  Precio del combustible (€/L)
                </label>
                <Input
                  id="trip-fuel-price"
                  {...fieldProps("fuelPrice")}
                  type="number"
                  min="0"
                  step="0.001"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder="Ej: 1.659"
                />
                {fieldError("fuelPrice")}
              </div>
            </div>

            <div>
              <label htmlFor="trip-people" className="fl-label mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                Número de personas
              </label>
              <Input
                id="trip-people"
                  {...fieldProps("people")}
                type="number"
                min="1"
                step="1"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
                {fieldError("people")}
            </div>
          </div>

          <Surface variant="inset" as="section" className="fl-trip-result" aria-labelledby="trip-estimate-title">
            <h2 id="trip-estimate-title" className="fl-section-title">Estimación</h2>
            {!valid && <p className="fl-supporting mt-3">Completa los campos con valores válidos para ver la estimación.</p>}
            <dl>
              <div className="fl-trip-result-row"><dt><Droplets size={18} aria-hidden="true" />Cantidad necesaria</dt><dd>{result(estimatedLiters, "L")}</dd></div>
              <div className="fl-trip-total"><dt>Coste total</dt><dd>{result(totalCost, "€")}</dd></div>
              <div className="fl-trip-result-row"><dt><Users size={18} aria-hidden="true" />Por persona</dt><dd>{result(costPerPerson, "€")}</dd></div>
            </dl>
            {valid && Number(people) <= 1 && <p className="fl-supporting mt-3">Añade más pasajeros para dividir el coste</p>}
          </Surface>
        </div>
      </Surface>
    </section>
  );
}
