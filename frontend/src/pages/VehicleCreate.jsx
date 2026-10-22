import useActionGuard from "../hooks/useActionGuard";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import {
  GEARBOX_OPTIONS,
  VEHICLE_ENERGY_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  getConsumptionUnit,
  getOdometerLabel,
} from "../utils/vehicleLabels";
import { Button } from "../components/ui/button";
import { Surface } from "../components/ui/surface";
import { Input } from "../components/ui/field";
import CustomSelect from "../components/CustomSelect";

const initialForm = {
  vehicleType: "",
  vehicleEnergyType: "",
  brand: "",
  model: "",
  power: "",
  cc: "",
  year: "",
  odometer: "",
  tankCapacity: "",
  officialConsumption: "",
  gearbox: "",
};

export default function VehicleCreate() {
  const { guard, isActive } = useActionGuard();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = guard(async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // validate required fields
    const errors = {};
    if (!form.vehicleType) errors.vehicleType = "required";
    if (!form.brand || !form.brand.trim()) errors.brand = "required";
    if (!form.model || !form.model.trim()) errors.model = "required";
    if (!form.power || Number(form.power) <= 0) errors.power = "required";
    if (!form.year || Number(form.year) < 1900 || Number(form.year) > 2100) errors.year = "required";
    if (!form.vehicleEnergyType) errors.vehicleEnergyType = "required";
    if (!form.tankCapacity || Number(form.tankCapacity) <= 0) errors.tankCapacity = "required";
    if (!form.gearbox) errors.gearbox = "required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // focus first invalid field? keep simple: abort
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await apiFetch("/api/vehicles", {
        method: "POST",
        body: {
          vehicleType: form.vehicleType,
          vehicleEnergyType: form.vehicleEnergyType,
          brand: form.brand.trim(),
          model: form.model.trim(),
          power: Number(form.power),
          cc: Number(form.cc),
          year: Number(form.year),
          odometer: form.odometer ? Number(form.odometer) : null,
          tankCapacity: form.tankCapacity ? Number(form.tankCapacity) : null,
          officialConsumption: form.officialConsumption ? Number(form.officialConsumption) : null,
          gearbox: form.gearbox,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo crear el coche");
      }

      const createdVehicle = await response.json();
      if (!isActive()) return;
      navigate(`/vehicles/${createdVehicle.id}`);
    } catch (submitError) {
      if (!isActive()) return;
      setErrorMessage(submitError.message || "No se pudo crear el coche");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <main className="section-shell pb-10">
      <Surface as="section" className="fl-workspace fl-vehicle-editor">
        <header className="fl-workspace-heading"><div><p className="fl-eyebrow">Alta de vehículo</p><h1 className="fl-page-title mt-2">Un nuevo espacio en tu garaje</h1><p className="fl-supporting mt-3">Completa los datos principales. Los campos con * son obligatorios.</p></div><Button asChild variant="outline"><Link to="/dashboard">Volver al selector</Link></Button></header>
        {errorMessage && <div role="alert" className="fl-feedback-error">{errorMessage}</div>}
        <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-7">
        <fieldset className="fl-vehicle-fieldset">
          <legend>Identificación</legend>
          <p className="fl-supporting mb-5">Los datos que distinguen tu vehículo.</p>
          <div className="fl-form-grid">
            <div className="fl-field-group">
              <label htmlFor="vehicle-vehicleType" className="fl-label">Tipo de vehículo *</label>
              <CustomSelect
                appearance="atlantic"
                id="vehicle-vehicleType"
                aria-describedby={fieldErrors.vehicleType ? "vehicle-vehicleType-error" : undefined}
                options={VEHICLE_TYPE_OPTIONS}
                value={form.vehicleType}
                onChange={(val) => setForm((c) => ({ ...c, vehicleType: val }))}
                placeholder="---"
                error={!!fieldErrors.vehicleType}
              />
              {fieldErrors.vehicleType ? (
                <p id="vehicle-vehicleType-error" className="text-sm text-destructive">Campo obligatorio</p>
              ) : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-brand" className="fl-label">Marca *</label>
              <Input
                id="vehicle-brand"
                aria-invalid={!!fieldErrors.brand}
                aria-describedby={fieldErrors.brand ? "vehicle-brand-error" : undefined}
                placeholder="Mercedes"
                value={form.brand}
                onChange={handleChange("brand")}
              />
              {fieldErrors.brand ? (
                <p id="vehicle-brand-error" className="text-sm text-destructive">Campo obligatorio</p>
              ) : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-model" className="fl-label">Modelo *</label>
              <Input
                id="vehicle-model"
                aria-invalid={!!fieldErrors.model}
                aria-describedby={fieldErrors.model ? "vehicle-model-error" : undefined}
                placeholder="C220 CDI"
                value={form.model}
                onChange={handleChange("model")}
              />
              {fieldErrors.model ? (
                <p id="vehicle-model-error" className="text-sm text-destructive">Campo obligatorio</p>
              ) : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-year" className="fl-label">Año *</label>
              <Input
                id="vehicle-year"
                aria-invalid={!!fieldErrors.year}
                aria-describedby={fieldErrors.year ? "vehicle-year-error" : undefined}
                placeholder="2011"
                type="number"
                min="1900"
                max="2100"
                step="1"
                value={form.year}
                onChange={handleChange("year")}
              />
              {fieldErrors.year ? <p id="vehicle-year-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
            </div>
          </div>
        </fieldset>
        <fieldset className="fl-vehicle-fieldset">
          <legend>Motor y transmisión</legend>
          <p className="fl-supporting mb-5">Características técnicas.</p>
          <div className="fl-form-grid">
            <div className="fl-field-group">
              <label htmlFor="vehicle-power" className="fl-label">Potencia (CV) *</label>
              <Input
                id="vehicle-power"
                aria-invalid={!!fieldErrors.power}
                aria-describedby={fieldErrors.power ? "vehicle-power-error" : undefined}
                placeholder="150"
                type="number"
                min="0"
                step="1"
                value={form.power}
                onChange={handleChange("power")}
              />
              {fieldErrors.power ? <p id="vehicle-power-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-cc" className="fl-label">Cilindrada (cc) <span className="text-muted-foreground">(opcional)</span></label>
              <Input
                id="vehicle-cc"
                aria-invalid={!!fieldErrors.cc}
                aria-describedby={fieldErrors.cc ? "vehicle-cc-error" : undefined}
                placeholder="2143"
                type="number"
                min="0"
                step="1"
                value={form.cc}
                onChange={handleChange("cc")}
              />
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-gearbox" className="fl-label">Cambio *</label>
              <CustomSelect
                appearance="atlantic"
                id="vehicle-gearbox"
                aria-describedby={fieldErrors.gearbox ? "vehicle-gearbox-error" : undefined}
                options={GEARBOX_OPTIONS}
                value={form.gearbox}
                onChange={(val) => setForm((c) => ({ ...c, gearbox: val }))}
                placeholder="---"
                error={!!fieldErrors.gearbox}
              />
              {fieldErrors.gearbox ? (
                <p id="vehicle-gearbox-error" className="text-sm text-destructive">Campo obligatorio</p>
              ) : null}
            </div>
          </div>
        </fieldset>
        <fieldset className="fl-vehicle-fieldset">
          <legend>Uso y consumo</legend>
          <p className="fl-supporting mb-5">La referencia para tus próximos registros.</p>
          <div className="fl-form-grid">
            <div className="fl-field-group">
              <label htmlFor="vehicle-odometer" className="fl-label">{getOdometerLabel(form.vehicleType)} actual <span className="text-muted-foreground">(opcional)</span></label>
              <Input
                id="vehicle-odometer"
                aria-invalid={!!fieldErrors.odometer}
                aria-describedby={fieldErrors.odometer ? "vehicle-odometer-error" : undefined}
                placeholder={form.vehicleType === "agricultural" ? "1200" : "184000"}
                type="number"
                min="0"
                step="1"
                value={form.odometer}
                onChange={handleChange("odometer")}
              />
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-vehicleEnergyType" className="fl-label">Tipo de combustible *</label>
              <CustomSelect
                appearance="atlantic"
                id="vehicle-vehicleEnergyType"
                aria-describedby={fieldErrors.vehicleEnergyType ? "vehicle-vehicleEnergyType-error" : undefined}
                options={VEHICLE_ENERGY_TYPE_OPTIONS}
                value={form.vehicleEnergyType}
                onChange={(val) => setForm((c) => ({ ...c, vehicleEnergyType: val }))}
                placeholder="---"
                error={!!fieldErrors.vehicleEnergyType}
              />
              {fieldErrors.vehicleEnergyType ? (
                <p id="vehicle-vehicleEnergyType-error" className="text-sm text-destructive">Campo obligatorio</p>
              ) : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-tankCapacity" className="fl-label">Capacidad del depósito *</label>
              <Input
                id="vehicle-tankCapacity"
                aria-invalid={!!fieldErrors.tankCapacity}
                aria-describedby={fieldErrors.tankCapacity ? "vehicle-tankCapacity-error" : undefined}
                placeholder="66.0"
                type="number"
                min="0"
                step="0.1"
                value={form.tankCapacity}
                onChange={handleChange("tankCapacity")}
              />
              {fieldErrors.tankCapacity ? <p id="vehicle-tankCapacity-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-officialConsumption" className="fl-label">
                Consumo oficial <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="vehicle-officialConsumption"
                aria-invalid={!!fieldErrors.officialConsumption}
                aria-describedby={fieldErrors.officialConsumption ? "vehicle-officialConsumption-error" : undefined}
                placeholder={`5.8 ${getConsumptionUnit(form.vehicleType, form.vehicleEnergyType)}`}
                type="number"
                min="0"
                step="0.1"
                value={form.officialConsumption}
                onChange={handleChange("officialConsumption")}
              />
            </div>
          </div>
        </fieldset>
          <div className="fl-form-actions"><Button type="submit" pending={submitting} pendingLabel="Creando coche...">Crear coche</Button><Button asChild variant="outline"><Link to="/dashboard">Cancelar</Link></Button></div>
        </form>
        <aside className="fl-vehicle-form-note"><h2 className="font-medium">Tu vehículo, conectado con el resto</h2><ul className="fl-supporting mt-2 list-disc pl-5 space-y-1"><li>Registrar repostajes y ver evolución de consumo.</li><li>Centralizar gastos y mantenimiento.</li><li>Consultar estadísticas y tendencias del coche.</li></ul><p className="fl-supporting mt-3">Puedes volver al selector o cerrar sesión desde tu cuenta cuando quieras.</p></aside>
      </Surface>
    </main>
  );
}
