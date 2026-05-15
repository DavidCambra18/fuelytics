import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CustomSelect from "../components/CustomSelect";
import {
  REFUELING_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  DRIVING_TYPE_OPTIONS,
  TIRE_TYPE_OPTIONS,
  formatRefuelingType,
  formatFuelType,
} from "../utils/vehicleLabels";

function createInitialFormData(vehicle) {
  return {
    date: new Date().toISOString().split("T")[0],
    odometer: "",
    refueling: "complete",
    fuelType: vehicle?.fuelType || "diesel_a",
    distance: "",
    liters: "",
    priceTotal: "",
    drivingType: "normal",
    tireType: "summer",
    highway: false,
    city: false,
    road: false,
    ac: false,
    trailer: false,
    heating: false,
    boardConsumption: "",
    averageSpeed: "",
    notes: "",
  };
}

function toFormData(fueling) {
  return {
    date: fueling?.date || new Date().toISOString().split("T")[0],
    odometer: fueling?.odometer ?? "",
    refueling: fueling?.refueling || "complete",
    fuelType: fueling?.fuelType || "diesel_a",
    distance: fueling?.distance ?? "",
    liters: fueling?.liters ?? "",
    priceTotal: fueling?.priceTotal ?? "",
    drivingType: fueling?.drivingType || "normal",
    tireType: fueling?.tireType || "summer",
    highway: Boolean(fueling?.highway),
    city: Boolean(fueling?.city),
    road: Boolean(fueling?.road),
    ac: Boolean(fueling?.ac),
    trailer: Boolean(fueling?.trailer),
    heating: Boolean(fueling?.heating),
    boardConsumption: fueling?.boardConsumption ?? "",
    averageSpeed: fueling?.averageSpeed ?? "",
    notes: fueling?.notes ?? "",
  };
}

function formatDateEs(value) {
  if (!value) {
    return "No definida";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function Fuelings() {
  const { selectedVehicle } = useOutletContext();
  const [fuelings, setFuelings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFueling, setEditingFueling] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(() => createInitialFormData(selectedVehicle));

  useEffect(() => {
    setFormData(createInitialFormData(selectedVehicle));
  }, [selectedVehicle]);

  useEffect(() => {
    const loadFuelings = async () => {
      if (!selectedVehicle?.id) return;

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/fuelings/vehicle/${selectedVehicle.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los repostajes");
        }

        const data = await response.json();
        setFuelings(data || []);
      } catch (fetchError) {
        setError(fetchError.message || "Error cargando repostajes");
      } finally {
        setLoading(false);
      }
    };

    loadFuelings();
  }, [selectedVehicle?.id]);

  const openCreateForm = () => {
    setEditingFueling(null);
    setFormData(createInitialFormData(selectedVehicle));
    setShowForm(true);
  };

  const openEditForm = (fueling) => {
    setEditingFueling(fueling);
    setFormData(toFormData(fueling));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFueling(null);
    setFormData(createInitialFormData(selectedVehicle));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const payload = {
        vehicleId: selectedVehicle.id,
        date: formData.date,
        odometer: toNumber(formData.odometer),
        refueling: formData.refueling,
        fuelType: formData.fuelType,
        distance: toNumber(formData.distance),
        liters: toNumber(formData.liters),
        priceTotal: toNumber(formData.priceTotal),
        drivingType: formData.drivingType,
        tireType: formData.tireType,
        highway: formData.highway,
        city: formData.city,
        road: formData.road,
        ac: formData.ac,
        trailer: formData.trailer,
        heating: formData.heating,
        boardConsumption: toNumber(formData.boardConsumption),
        averageSpeed: toNumber(formData.averageSpeed),
        notes: formData.notes,
      };

      const response = await fetch(
        editingFueling
          ? `http://localhost:8080/api/fuelings/${editingFueling.id}`
          : "http://localhost:8080/api/fuelings",
        {
          method: editingFueling ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al guardar el repostaje");
      }

      const savedFueling = await response.json();

      setFuelings((currentFuelings) =>
        editingFueling
          ? currentFuelings.map((item) => (item.id === savedFueling.id ? savedFueling : item))
          : [savedFueling, ...currentFuelings]
      );

      closeForm();
    } catch (submitError) {
      setError(submitError.message || "Error guardando repostaje");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fueling) => {
    const confirmed = window.confirm("¿Seguro que quieres borrar este repostaje?");

    if (!confirmed) {
      return;
    }

    setDeletingId(fueling.id);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/fuelings/${fueling.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al borrar el repostaje");
      }

      setFuelings((currentFuelings) => currentFuelings.filter((item) => item.id !== fueling.id));
    } catch (deleteError) {
      setError(deleteError.message || "Error borrando repostaje");
    } finally {
      setDeletingId(null);
    }
  };

  const totalDistance = fuelings.reduce((acc, fueling) => acc + Number(fueling.distance || 0), 0);
  const totalLiters = fuelings.reduce((acc, fueling) => acc + Number(fueling.liters || 0), 0);
  const totalPrice = fuelings.reduce((acc, fueling) => acc + Number(fueling.priceTotal || 0), 0);

  const consumo = totalDistance > 0 ? ((totalLiters / totalDistance) * 100).toFixed(2) : "0.00";
  const costPerKm = totalDistance > 0 ? (totalPrice / totalDistance).toFixed(3) : "0.000";

  return (
    <section className="w-full space-y-6">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-2 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Repostajes</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Consumos de {selectedVehicle.brand} {selectedVehicle.model}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 max-w-2xl">
            Historial detallado de repostajes, litros, costes y eficiencia.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="mb-6 inline-flex rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          + Nuevo repostaje
        </button>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-8 text-center text-slate-400">Cargando...</div>
        ) : fuelings.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            No hay repostajes registrados. ¡Crea uno para empezar!
          </div>
        ) : (
          <div className="space-y-3">
            {fuelings.map((fueling) => {
              const liters = Number(fueling.liters) || 0;
              const distance = Number(fueling.distance) || 0;
              const priceTotal = Number(fueling.priceTotal) || 0;
              const pricePerLiter = liters > 0 ? (priceTotal / liters).toFixed(3) : "0.000";
              const realConsumption = distance > 0 ? ((liters / distance) * 100).toFixed(2) : "0.00";

              return (
                <div
                  key={fueling.id}
                  className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4 transition hover:border-slate-600/50"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{formatDateEs(fueling.date)}</p>
                      <p className="mt-1 text-xs text-slate-400">{pricePerLiter} €/L</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(fueling)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-teal-300/40 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(fueling)}
                        disabled={deletingId === fueling.id}
                        className="rounded-full border border-rose-400/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-300/40 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === fueling.id ? "Borrando..." : "Borrar"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr_1fr_1fr] lg:items-start">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Combustible</p>
                      <p className="mt-1 text-white font-medium">{formatFuelType(fueling.fuelType)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Kms</p>
                      <p className="mt-1 text-white font-medium">
                        {distance.toLocaleString("es-ES", { maximumFractionDigits: 1 })} km
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Litros / Total</p>
                      <p className="mt-1 text-white font-medium">
                        {liters.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} L
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {priceTotal.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Repostaje</p>
                      <p className="mt-1 text-white font-medium">{formatRefuelingType(fueling.refueling)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Consumo real</p>
                      <p className="mt-1 text-white font-medium">{realConsumption} L/100km</p>
                    </div>
                  </div>

                  {fueling.notes ? (
                    <div className="mt-3 rounded bg-slate-900/50 p-3 text-sm text-slate-300">
                      {fueling.notes}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </article>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Repostajes</p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {editingFueling ? "Editar repostaje" : "Nuevo repostaje"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Fecha</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Odómetro (km)</label>
                  <input
                    type="number"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tipo de repostaje</label>
                  <CustomSelect
                    options={REFUELING_TYPE_OPTIONS}
                    value={formData.refueling}
                    onChange={(value) => handleSelectChange("refueling", value)}
                    placeholder="Selecciona tipo"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tipo de combustible</label>
                  <CustomSelect
                    options={FUEL_TYPE_OPTIONS}
                    value={formData.fuelType}
                    onChange={(value) => handleSelectChange("fuelType", value)}
                    placeholder="Selecciona combustible"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Distancia (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance"
                    value={formData.distance}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Litros</label>
                  <input
                    type="number"
                    step="0.01"
                    name="liters"
                    value={formData.liters}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Precio total (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="priceTotal"
                    value={formData.priceTotal}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tipo de conducción</label>
                  <CustomSelect
                    options={DRIVING_TYPE_OPTIONS}
                    value={formData.drivingType}
                    onChange={(value) => handleSelectChange("drivingType", value)}
                    placeholder="Selecciona tipo"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tipo de neumáticos</label>
                  <CustomSelect
                    options={TIRE_TYPE_OPTIONS}
                    value={formData.tireType}
                    onChange={(value) => handleSelectChange("tireType", value)}
                    placeholder="Selecciona tipo"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Consumo display (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="boardConsumption"
                    value={formData.boardConsumption}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    placeholder="L/100km"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Velocidad promedio (opcional)</label>
                  <input
                    type="number"
                    name="averageSpeed"
                    value={formData.averageSpeed}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    placeholder="km/h"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    ["highway", "Autopista"],
                    ["city", "Ciudad"],
                    ["road", "Carretera"],
                    ["ac", "A/C activado"],
                    ["trailer", "Con remolque"],
                    ["heating", "Calefacción activada"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key]}
                      onChange={handleInputChange}
                      className="rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-300">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Notas (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  placeholder="Añade notas adicionales..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? "Guardando..." : editingFueling ? "Guardar cambios" : "Guardar repostaje"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
