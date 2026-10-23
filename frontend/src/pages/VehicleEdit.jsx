import useActionGuard from "../hooks/useActionGuard";
import useValidationFocus from "../hooks/useValidationFocus";
import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
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

export default function VehicleEdit() {
  const { guard, isActive } = useActionGuard();
  const navigate = useNavigate();
  const { selectedVehicle, updateVehicle } = useOutletContext();
  const [form, setForm] = useState({
    vehicleType: selectedVehicle?.vehicleType || "",
    brand: selectedVehicle?.brand || "",
    model: selectedVehicle?.model || "",
    power: selectedVehicle?.power || "",
    cc: selectedVehicle?.cc || "",
    year: selectedVehicle?.year || "",
    odometer: selectedVehicle?.odometer || "",
    vehicleEnergyType: selectedVehicle?.vehicleEnergyType || "",
    tankCapacity: selectedVehicle?.tankCapacity || "",
    officialConsumption: selectedVehicle?.officialConsumption || "",
    gearbox: selectedVehicle?.gearbox || "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useValidationFocus(fieldErrors);
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
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await apiFetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: "PUT",
        body: {
          vehicleType: form.vehicleType,
          vehicleEnergyType: form.vehicleEnergyType,
          brand: form.brand.trim(),
          model: form.model.trim(),
          power: Number(form.power),
          cc: form.cc ? Number(form.cc) : null,
          year: Number(form.year),
          odometer: form.odometer ? Number(form.odometer) : null,
          tankCapacity: form.tankCapacity ? Number(form.tankCapacity) : null,
          officialConsumption: form.officialConsumption ? Number(form.officialConsumption) : null,
          gearbox: form.gearbox,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "No se pudo actualizar el coche");
      }

      const savedVehicle = await response.json();
      if (!isActive()) return;
      updateVehicle(savedVehicle);
      navigate(`/vehicles/${selectedVehicle.id}`);
    } catch (submitError) {
      if (!isActive()) return;
      setErrorMessage(submitError.message || "No se pudo actualizar el coche");
    } finally {
      setSubmitting(false);
    }
  });

  if (!selectedVehicle) return <Surface className="fl-workspace"><h2 className="fl-section-title">No hay vehículo seleccionado</h2><Button asChild variant="outline" className="mt-4"><Link to="/dashboard">Volver al selector</Link></Button></Surface>;
  return (
    <Surface as="section" className="fl-workspace fl-vehicle-editor">
      <header className="mb-7"><p className="fl-eyebrow">Editar vehículo</p><h2 className="fl-section-title mt-2">Cada detalle, en su sitio</h2><p className="fl-supporting mt-2">Actualiza los datos del vehículo. Los campos con * son obligatorios.</p></header>
      {errorMessage && <div role="alert" className="fl-feedback-error">{errorMessage}</div>}
      <form ref={formRef} onSubmit={handleSubmit} aria-busy={submitting} className="space-y-7">
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
              {fieldErrors.vehicleType ? <p id="vehicle-vehicleType-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
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
                required
              />
              {fieldErrors.brand ? <p id="vehicle-brand-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
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
                required
              />
              {fieldErrors.model ? <p id="vehicle-model-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
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
                required
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
                required
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
              {fieldErrors.gearbox ? <p id="vehicle-gearbox-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
            </div>
          </div>
        </fieldset>
        <fieldset className="fl-vehicle-fieldset">
          <legend>Uso y consumo</legend>
          <p className="fl-supporting mb-5">La referencia para tus próximos registros.</p>
          <div className="fl-form-grid">
            <div className="fl-field-group">
              <label htmlFor="vehicle-odometer" className="fl-label">{getOdometerLabel(form.vehicleType)} actual</label>
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
              {fieldErrors.vehicleEnergyType ? <p id="vehicle-vehicleEnergyType-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-tankCapacity" className="fl-label">Capacidad del depósito (L) *</label>
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
                required
              />
              {fieldErrors.tankCapacity ? <p id="vehicle-tankCapacity-error" className="text-sm text-destructive">Campo obligatorio</p> : null}
            </div>
            <div className="fl-field-group">
              <label htmlFor="vehicle-officialConsumption" className="fl-label">Consumo oficial <span className="text-muted-foreground">(opcional)</span></label>
              <Input
                id="vehicle-officialConsumption"
                aria-invalid={!!fieldErrors.officialConsumption}
                aria-describedby={fieldErrors.officialConsumption ? "vehicle-officialConsumption-error" : undefined}
                placeholder={`5.6 ${getConsumptionUnit(form.vehicleType, form.vehicleEnergyType)}`}
                type="number"
                min="0"
                step="0.1"
                value={form.officialConsumption}
                onChange={handleChange("officialConsumption")}
              />
            </div>
          </div>
        </fieldset>
        <div className="fl-form-actions"><Button type="submit" pending={submitting} pendingLabel="Guardando...">Guardar cambios</Button><Button asChild variant="outline"><Link to={`/vehicles/${selectedVehicle.id}`}>Cancelar</Link></Button></div>
      </form>
    </Surface>
  );
}
