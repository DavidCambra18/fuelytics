import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { API_BASE } from "../config/api";
import {
  GEARBOX_OPTIONS,
  VEHICLE_ENERGY_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "../utils/vehicleLabels";
import CustomSelect from "../components/CustomSelect";

export default function VehicleEdit() {
  const navigate = useNavigate();
  const { selectedVehicle } = useOutletContext();
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
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/vehicles/${selectedVehicle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el coche");
      }

      navigate(`/vehicles/${selectedVehicle.id}`);
    } catch (submitError) {
      setErrorMessage(submitError.message || "No se pudo actualizar el coche");
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedVehicle) {
    return (
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="text-lg font-semibold text-white">No hay vehículo seleccionado</p>
        <Link to="/dashboard" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950">
          Volver al selector
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr]">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Editar</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Actualizar detalles del coche</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Modifica los datos del vehículo según sea necesario.
        </p>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">Tipo de vehículo *</span>
              <CustomSelect
                options={VEHICLE_TYPE_OPTIONS}
                value={form.vehicleType}
                onChange={(val) => setForm((c) => ({ ...c, vehicleType: val }))}
                placeholder="---"
                error={!!fieldErrors.vehicleType}
              />
              {fieldErrors.vehicleType ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Marca *</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Mercedes"
                value={form.brand}
                onChange={handleChange("brand")}
                style={fieldErrors.brand ? { boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.06)" } : {}}
                required
              />
              {fieldErrors.brand ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Modelo *</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="C220 CDI"
                value={form.model}
                onChange={handleChange("model")}
                style={fieldErrors.model ? { boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.06)" } : {}}
                required
              />
              {fieldErrors.model ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Potencia (CV) *</span>
              <input
                className={
                  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20" +
                  (fieldErrors.power ? " ring-1 ring-rose-400/25" : "")
                }
                placeholder="150"
                type="number"
                min="0"
                step="1"
                value={form.power}
                onChange={handleChange("power")}
                required
              />
              {fieldErrors.power ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Cilindrada (cc) <span className="text-slate-500">(opcional)</span></span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="2143"
                type="number"
                min="0"
                step="1"
                value={form.cc}
                onChange={handleChange("cc")}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Año *</span>
              <input
                className={
                  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                }
                placeholder="2011"
                type="number"
                min="1900"
                max="2100"
                step="1"
                value={form.year}
                onChange={handleChange("year")}
                required
              />
              {fieldErrors.year ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Kilometraje actual</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="184000"
                type="number"
                min="0"
                step="1"
                value={form.odometer}
                onChange={handleChange("odometer")}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">Tipo de energía *</span>
              <CustomSelect
                options={VEHICLE_ENERGY_TYPE_OPTIONS}
                value={form.vehicleEnergyType}
                onChange={(val) => setForm((c) => ({ ...c, vehicleEnergyType: val }))}
                placeholder="---"
                error={!!fieldErrors.vehicleEnergyType}
              />
              {fieldErrors.vehicleEnergyType ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Capacidad del depósito (L) *</span>
              <input
                className={
                  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20" +
                  (fieldErrors.tankCapacity ? " ring-1 ring-rose-400/25" : "")
                }
                placeholder="66.0"
                type="number"
                min="0"
                step="0.1"
                value={form.tankCapacity}
                onChange={handleChange("tankCapacity")}
                required
              />
              {fieldErrors.tankCapacity ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Consumo oficial <span className="text-slate-500">(opcional)</span></span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="5.6"
                type="number"
                min="0"
                step="0.1"
                value={form.officialConsumption}
                onChange={handleChange("officialConsumption")}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Cambio *</span>
              <CustomSelect
                options={GEARBOX_OPTIONS}
                value={form.gearbox}
                onChange={(val) => setForm((c) => ({ ...c, gearbox: val }))}
                placeholder="---"
                error={!!fieldErrors.gearbox}
              />
              {fieldErrors.gearbox ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>
          </div>

          <div className="flex gap-3">
            <button
              disabled={submitting}
              className="flex-1 rounded-2xl bg-white px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link
              to={`/vehicles/${selectedVehicle.id}`}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
