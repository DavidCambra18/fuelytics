import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, CircleAlert, Flame, Fuel, Gauge, Route, Snowflake, Sparkles, Truck, Download } from "lucide-react";
import { apiFetch } from "../services/api";
import CustomSelect from "../components/CustomSelect";
import ExportReportModal from "../components/ExportReportModal";
import {
  REFUELING_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  DRIVING_TYPE_OPTIONS,
  TIRE_TYPE_OPTIONS,
  formatRefuelingType,
  formatFuelType,
  getConsumptionUnit,
} from "../utils/vehicleLabels";

function createInitialFormData(vehicle) {
  return {
    date: new Date().toISOString().split("T")[0],
    odometer: "",
    refueling: "complete",
    fuelType: vehicle?.fuelType || "diesel",
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
    fuelType: fueling?.fuelType || "diesel",
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

function buildFuelingRows(fuelings) {
  const sortedFuelings = [...fuelings].sort((left, right) => {
    const leftDate = new Date(`${left.date}T00:00:00`).getTime();
    const rightDate = new Date(`${right.date}T00:00:00`).getTime();

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });

  let accumulatedDistance = 0;
  let accumulatedLiters = 0;
  let accumulatedPrice = 0;
  let hasBaseline = false;

  return sortedFuelings.map((fueling) => {
    const liters = Number(fueling.liters || 0);
    const distance = Number(fueling.distance || 0);
    const priceTotal = Number(fueling.priceTotal || 0);
    const refuelingType = fueling.refueling;

    if (!hasBaseline) {
      hasBaseline = true;

      if (refuelingType === "partial") {
        accumulatedDistance = distance;
        accumulatedLiters = liters;
        accumulatedPrice = priceTotal;

        return {
          ...fueling,
          displayState: "partial",
          displayConsumption: distance > 0 ? (liters / distance) * 100 : null,
        };
      }

      accumulatedDistance = 0;
      accumulatedLiters = 0;
      accumulatedPrice = 0;

      return {
        ...fueling,
        displayState: "start",
        displayConsumption: null,
      };
    }

    accumulatedDistance += distance;
    accumulatedLiters += liters;
    accumulatedPrice += priceTotal;

    if (refuelingType === "complete") {
      const verifiedConsumption = accumulatedDistance > 0 ? (accumulatedLiters / accumulatedDistance) * 100 : null;
      const verifiedPricePerLiter = accumulatedLiters > 0 ? accumulatedPrice / accumulatedLiters : null;

      accumulatedDistance = 0;
      accumulatedLiters = 0;
      accumulatedPrice = 0;

      return {
        ...fueling,
        displayState: "verified",
        displayConsumption: verifiedConsumption,
        displayPricePerLiter: verifiedPricePerLiter,
      };
    }

    return {
      ...fueling,
      displayState: refuelingType === "initial" ? "start" : "estimated",
      displayConsumption: accumulatedDistance > 0 ? (accumulatedLiters / accumulatedDistance) * 100 : null,
    };
  });
}

export default function Fuelings() {
  const { selectedVehicle } = useOutletContext();
  const [fuelings, setFuelings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingFueling, setEditingFueling] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exportTarget, setExportTarget] = useState(null);
  const [formData, setFormData] = useState(() => createInitialFormData(selectedVehicle));
  const fuelingRows = useMemo(() => buildFuelingRows(fuelings), [fuelings]);
  const exportDateRange = useMemo(() => {
    if (fuelings.length === 0) {
      return {};
    }

    const dates = fuelings
      .map((fueling) => fueling.date)
      .filter(Boolean)
      .sort();

    if (dates.length === 0) {
      return {};
    }

    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    };
  }, [fuelings]);

  useEffect(() => {
    setFormData(createInitialFormData(selectedVehicle));
  }, [selectedVehicle]);

  useEffect(() => {
    const loadFuelings = async () => {
      if (!selectedVehicle?.id) return;

      setLoading(true);
      setError("");

      try {
        const response = await apiFetch(`/api/fuelings/vehicle/${selectedVehicle.id}`);

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

      const response = await apiFetch(
        editingFueling
          ? `/api/fuelings/${editingFueling.id}`
          : "/api/fuelings",
        {
          method: editingFueling ? "PUT" : "POST",
          body: payload,
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
      const response = await apiFetch(`/api/fuelings/${fueling.id}`, {
        method: "DELETE",
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

  const fuelingHelpItems = [
    {
      title: "Repostaje completo",
      text: "Marca este tipo cuando llenes el depósito hasta arriba. Es el único punto que cierra un ciclo y permite un consumo verificado.",
    },
    {
      title: "Repostaje parcial",
      text: "Sirve para registrar un tramo intermedio. No muestra consumo porque no es fiable hasta cerrar el ciclo con un repostaje completo.",
    },
    {
      title: "Repostaje inicial",
      text: "Úsalo en el primer registro para arrancar el seguimiento. Solo fija el punto de partida; no genera consumo exacto.",
    },
  ];

  const drivingConditionOptions = [
    {
      key: "highway",
      label: "Autopista",
      hint: "Tramos rápidos y continuos.",
      accent: "from-cyan-400/25 to-teal-400/20",
      Icon: Route,
    },
    {
      key: "city",
      label: "Ciudad",
      hint: "Paradas frecuentes y tráfico denso.",
      accent: "from-amber-400/20 to-orange-400/15",
      Icon: Building2,
    },
    {
      key: "road",
      label: "Carretera",
      hint: "Trayectos mixtos fuera de ciudad.",
      accent: "from-sky-400/20 to-indigo-400/15",
      Icon: Gauge,
    },
    {
      key: "ac",
      label: "A/C activado",
      hint: "Aire acondicionado durante el trayecto.",
      accent: "from-sky-300/20 to-cyan-300/15",
      Icon: Snowflake,
    },
    {
      key: "trailer",
      label: "Con remolque",
      hint: "Carga o arrastre adicional.",
      accent: "from-rose-400/20 to-red-400/15",
      Icon: Truck,
    },
    {
      key: "heating",
      label: "Calefacción activada",
      hint: "Uso de calefacción en marcha.",
      accent: "from-violet-400/20 to-fuchsia-400/15",
      Icon: Flame,
    },
  ];

  const displayFuelings = [...fuelingRows].reverse();

  return (
    <section className="w-full space-y-6">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-2 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Repostajes</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Consumos de {selectedVehicle.brand} {selectedVehicle.model}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 max-w-2xl">
            Historial detallado de repostajes con cálculo por ciclo lleno a lleno.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setExportTarget({ reportType: "fuelings", vehicle: selectedVehicle })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-teal-300/40 hover:bg-white/10 hover:text-white"
            aria-label="Exportar repostajes"
            title="Exportar repostajes"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-300/35 hover:bg-teal-300/15 hover:text-white"
          >
            Ayuda de repostaje
          </button>
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
            {displayFuelings.map((fueling) => {
              const liters = Number(fueling.liters) || 0;
              const distance = Number(fueling.distance) || 0;
              const priceTotal = Number(fueling.priceTotal) || 0;
              const pricePerLiter = liters > 0 ? (priceTotal / liters).toFixed(3) : "0.000";
              const displayedConsumption =
                fueling.displayConsumption !== null && fueling.displayConsumption !== undefined
                  ? fueling.displayConsumption.toFixed(2)
                  : null;
              const displayLabel =
                fueling.displayState === "verified"
                  ? "Consumo verificado"
                  : fueling.displayState === "partial"
                    ? "Sin consumo"
                    : "Inicio de ciclo";
              const displayTone =
                fueling.displayState === "verified"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : fueling.displayState === "partial"
                    ? "border-slate-500/20 bg-slate-500/10 text-slate-200"
                    : "border-white/10 bg-white/5 text-slate-200";
              const displayIcon =
                fueling.displayState === "verified"
                  ? Gauge
                  : fueling.displayState === "partial"
                    ? CircleAlert
                    : Fuel;
              const DisplayIcon = displayIcon;

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
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Estado del cálculo</p>
                      <div className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${displayTone}`}>
                        <DisplayIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {displayLabel}
                      </div>
                      {fueling.displayState === "verified" ? (
                        <p className="mt-2 text-white font-medium">
                          {displayedConsumption !== null
                            ? `${displayedConsumption} ${getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType)}`
                            : "Pendiente"}
                        </p>
                      ) : fueling.displayState === "partial" ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-500/30 bg-slate-950/40 p-3 text-sm text-slate-300">
                          <div className="flex items-center gap-2 text-slate-100">
                            <Sparkles className="h-4 w-4 text-amber-300" strokeWidth={2.2} />
                            <span className="font-semibold">Consumo pendiente de cerrar ciclo</span>
                          </div>
                          <p className="mt-2 leading-6 text-slate-400">
                            Este repostaje se guarda como tramo intermedio. El consumo real aparecerá cuando un repostaje completo cierre el ciclo.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-slate-400">
                    {fueling.displayState === "verified"
                      ? "Este valor cierra el ciclo anterior con la regla lleno a lleno."
                      : fueling.displayState === "partial"
                        ? "Este registro no muestra consumo. El cálculo real aparecerá cuando se cierre el ciclo con un lleno."
                        : "Este registro sirve como inicio de seguimiento y no genera consumo exacto."}
                  </p>

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
                  <label className="mb-2 block text-sm font-medium text-slate-300">Consumo display (opcional) <span className="text-slate-500">({getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType)})</span></label>
                  <input
                    type="number"
                    step="0.01"
                    name="boardConsumption"
                    value={formData.boardConsumption}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    placeholder={getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType)}
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
                {drivingConditionOptions.map(({ key, label, hint, accent, Icon }) => (
                  <label
                    key={key}
                    className={`group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-[1.35rem] border px-4 py-4 transition duration-200 ${formData[key]
                        ? "border-teal-300/35 bg-gradient-to-br from-teal-300/15 via-slate-950/80 to-slate-950/70 shadow-[0_10px_30px_rgba(8,145,178,0.12)]"
                        : "border-white/10 bg-slate-950/45 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                  >
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key]}
                      onChange={handleInputChange}
                      className="sr-only"
                    />

                    <span
                      className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-70 ${accent}`}
                      aria-hidden="true"
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${formData[key]
                              ? "border-teal-300/30 bg-teal-300/15 text-teal-100"
                              : "border-white/10 bg-white/[0.03] text-slate-300 group-hover:border-white/20"
                            }`}>
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="text-sm font-semibold text-white">{label}</span>
                        </div>
                        <p className="text-xs leading-5 text-slate-400">{hint}</p>
                      </div>


                    </div>
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

      {showHelp ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl shadow-black/50 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-teal-300">Ayuda rápida</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Cómo registrar el repostaje</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              La app calcula el consumo real con el método lleno a lleno. Los repostajes parciales sirven como tramos intermedios y se muestran como estimación hasta que llegue otro repostaje completo.
            </p>

            <div className="mt-5 space-y-3">
              {fuelingHelpItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-sm font-semibold text-amber-100">Regla simple</p>
              <p className="mt-1 text-sm leading-6 text-amber-50/90">
                LLENO → LLENO da el consumo más fiable. El inicial solo fija el arranque y el parcial no confirma consumo por sí solo.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
              Guarda siempre el odómetro total del vehículo cuando puedas. El parcial es útil para el tramo, pero el total es el que mejor evita errores de cálculo.
            </div>
          </div>
        </div>
      ) : null}

      {exportTarget ? (
        <ExportReportModal
          open={Boolean(exportTarget)}
          reportType={exportTarget.reportType}
          vehicle={exportTarget.vehicle}
          defaultStartDate={exportDateRange.startDate || ""}
          defaultEndDate={exportDateRange.endDate || ""}
          onClose={() => setExportTarget(null)}
        />
      ) : null}
    </section>
  );
}
