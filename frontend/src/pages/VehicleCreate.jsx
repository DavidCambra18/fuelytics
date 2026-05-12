import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FUEL_TYPE_OPTIONS,
  GEARBOX_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "../utils/vehicleLabels";
import CustomSelect from "../components/CustomSelect";

const initialForm = {
  vehicleType: "",
  brand: "",
  model: "",
  power: "",
  cc: "",
  year: "",
  odometer: "",
  fuelType: "",
  tankCapacity: "",
  gearbox: "",
};

export default function VehicleCreate() {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // validate required fields
    const errors = {};
    if (!form.brand || !form.brand.trim()) errors.brand = "required";
    if (!form.model || !form.model.trim()) errors.model = "required";
    if (!form.power || Number(form.power) <= 0) errors.power = "required";
    if (!form.year || Number(form.year) < 1900 || Number(form.year) > 2100) errors.year = "required";
    if (!form.vehicleType) errors.vehicleType = "required";
    if (!form.fuelType) errors.fuelType = "required";
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
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleType: form.vehicleType,
          brand: form.brand.trim(),
          model: form.model.trim(),
          power: Number(form.power),
          cc: Number(form.cc),
          year: Number(form.year),
          odometer: form.odometer ? Number(form.odometer) : null,
          fuelType: form.fuelType,
          tankCapacity: form.tankCapacity ? Number(form.tankCapacity) : null,
          gearbox: form.gearbox,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo crear el coche");
      }

      const createdVehicle = await response.json();
      navigate(`/vehicles/${createdVehicle.id}`);
    } catch (submitError) {
      setErrorMessage(submitError.message || "No se pudo crear el coche");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <div className="section-shell grid min-h-screen items-center gap-5 py-4 lg:grid-cols-[0.88fr_1.12fr] lg:py-6">
        <section className="order-2 space-y-5 lg:order-1">
          <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Alta de vehículo</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-[2rem]">Registrar un nuevo coche</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Completa los datos principales para empezar a trabajar con tu vehículo desde el primer momento.
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Qué podrás hacer luego</p>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-300">
              <li>• Registrar repostajes y ver evolución de consumo.</li>
              <li>• Centralizar gastos y mantenimiento.</li>
              <li>• Consultar estadísticas y tendencias del coche.</li>
            </ul>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="order-1 glass-panel w-full rounded-[2rem] p-5 shadow-2xl shadow-black/25 sm:p-6 lg:order-2"
        >
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Vehículo nuevo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-[2rem]">Crear coche</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Este coche quedará asociado a tu usuario para que puedas empezar a gestionarlo desde el selector.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">Tipo de vehículo *</span>
              <CustomSelect
                options={VEHICLE_TYPE_OPTIONS}
                value={form.vehicleType}
                onChange={(val) => setForm((c) => ({ ...c, vehicleType: val }))}
                placeholder="---"
                error={!!fieldErrors.vehicleType}
              />
              {fieldErrors.vehicleType ? (
                <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Marca *</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Mercedes"
                value={form.brand}
                onChange={handleChange("brand")}
                style={fieldErrors.brand ? { boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.06)" } : {}}
              />
              {fieldErrors.brand ? (
                <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Modelo *</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="C220 CDI"
                value={form.model}
                onChange={handleChange("model")}
                style={fieldErrors.model ? { boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.06)" } : {}}
              />
              {fieldErrors.model ? (
                <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p>
              ) : null}
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
              />
              {fieldErrors.year ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Kilometraje actual <span className="text-slate-500">(opcional)</span></span>
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
              <span className="mb-2 block text-sm font-medium text-slate-300">Combustible *</span>
              <CustomSelect
                options={FUEL_TYPE_OPTIONS}
                value={form.fuelType}
                onChange={(val) => setForm((c) => ({ ...c, fuelType: val }))}
                placeholder="---"
                error={!!fieldErrors.fuelType}
              />
              {fieldErrors.fuelType ? (
                <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Capacidad del depósito *</span>
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
              />
              {fieldErrors.tankCapacity ? <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p> : null}
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
              {fieldErrors.gearbox ? (
                <p className="mt-1 text-sm text-rose-200">Campo obligatorio</p>
              ) : null}
            </label>
          </div>

          <button
            disabled={submitting}
            className="mt-5 w-full rounded-2xl bg-white px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Creando coche..." : "Crear coche"}
          </button>

          <p className="mt-4 text-sm text-slate-400">
            Si todavía no quieres crear uno, puedes volver al selector o cerrar sesión desde tu cuenta.
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver al selector
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}