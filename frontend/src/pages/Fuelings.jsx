import { localDate } from "../utils/localDate";
import useActionGuard from "../hooks/useActionGuard";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, CircleAlert, CircleHelp, Flame, Fuel, Gauge, Route, Snowflake, Sparkles, Truck, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "../services/api";
import CustomSelect from "../components/CustomSelect";
import ExportReportModal from "../components/ExportReportModal";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/field";
import { DialogFrame } from "../components/ui/dialog-frame";
import useDialogAccessibility from "../hooks/useDialogAccessibility";
import useHistoryPage from "../hooks/useHistoryPage";
import { getPageNumbers } from "../utils/pagination";
import FormErrorSummary from "../components/FormErrorSummary";
import {
  REFUELING_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  DRIVING_TYPE_OPTIONS,
  TIRE_TYPE_OPTIONS,
  formatRefuelingType,
  formatFuelType,
  getConsumptionUnit,
  getDefaultFuelType,
  getFuelOptionsForEnergy,
  getQuantityUnitForFuel,
  getOdometerUnit,
} from "../utils/vehicleLabels";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function createInitialFormData(vehicle) {
  return {
    date: localDate(),
    odometer: "",
    refueling: "complete",
    fuelType: getDefaultFuelType(vehicle?.vehicleEnergyType),
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
    date: fueling?.date || localDate(),
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

export default function Fuelings() {
  const { guard, isActive } = useActionGuard();
  const { selectedVehicle, refreshVehicle } = useOutletContext();
  const { data: history, loading, error: historyError, setPage: setCurrentPage, reload: reloadHistory } = useHistoryPage("fuelings", selectedVehicle?.id);
  const fuelings = history.content.map((row) => ({ ...row.fueling, displayState: row.displayState, displayConsumption: row.displayConsumption }));
  const [error, setError] = useState("");
  const [formError, setFormError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingFueling, setEditingFueling] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exportTarget, setExportTarget] = useState(null);
  const [formData, setFormData] = useState(() => createInitialFormData(selectedVehicle));
  const fuelOptions = getFuelOptionsForEnergy(selectedVehicle?.vehicleEnergyType);
  const formQuantityUnit = getQuantityUnitForFuel(formData.fuelType);
  const { page: currentPage, totalPages, totalElements: totalItems } = history;
  const fieldProps = (name) => ({
    id: `fueling-${name}`,
    "aria-invalid": !!formError?.fields[name],
    "aria-describedby": formError?.fields[name] ? `fueling-${name}-error` : undefined,
  });
  const exportDateRange = { startDate: history.startDate, endDate: history.endDate };

  const openCreateForm = () => {
    setFormError(null);
    setEditingFueling(null);
    setFormData(createInitialFormData(selectedVehicle));
    setShowForm(true);
  };

  const openEditForm = (fueling) => {
    setFormError(null);
    setEditingFueling(fueling);
    setFormData(toFormData(fueling));
    setShowForm(true);
  };

  const closeForm = () => {
    setFormError(null);
    setShowForm(false);
    setEditingFueling(null);
    setFormData(createInitialFormData(selectedVehicle));
  };

  const closeHelp = () => setShowHelp(false);
  const { dialogRef: formDialogRef, titleId: formDialogTitleId, close: closeFormDialog } = useDialogAccessibility(showForm, closeForm);
  const { dialogRef: helpDialogRef, titleId: helpDialogTitleId, close: closeHelpDialog } = useDialogAccessibility(showHelp, closeHelp);

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

  const handleSubmit = guard(async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);

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
        throw Object.assign(new Error(errorData.message || "Error al guardar el repostaje"), { fields: errorData.fields || {} });
      }

      await response.json();
      void refreshVehicle(selectedVehicle.id);
      if (!isActive()) return;

      reloadHistory(!editingFueling);

      closeForm();
    } catch (submitError) {
      if (!isActive()) return;
      setFormError({ message: submitError.message || "Error guardando repostaje", fields: submitError.fields || {} });
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = guard(async (fueling) => {
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

      void refreshVehicle(selectedVehicle.id);
      if (!isActive()) return;
      reloadHistory();
    } catch (deleteError) {
      if (!isActive()) return;
      setError(deleteError.message || "Error borrando repostaje");
    } finally {
      setDeletingId(null);
    }
  });

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
      Icon: Route,
    },
    {
      key: "city",
      label: "Ciudad",
      hint: "Paradas frecuentes y tráfico denso.",
      Icon: Building2,
    },
    {
      key: "road",
      label: "Carretera",
      hint: "Trayectos mixtos fuera de ciudad.",
      Icon: Gauge,
    },
    {
      key: "ac",
      label: "A/C activado",
      hint: "Aire acondicionado durante el trayecto.",
      Icon: Snowflake,
    },
    {
      key: "trailer",
      label: "Con remolque",
      hint: "Carga o arrastre adicional.",
      Icon: Truck,
    },
    {
      key: "heating",
      label: "Calefacción activada",
      hint: "Uso de calefacción en marcha.",
      Icon: Flame,
    },
  ];

  const displayFuelings = fuelings;

  const currentFuelings = displayFuelings;

  return (
    <section className="w-full space-y-6">
      <Surface as="article" className="fl-workspace fl-fuelings">
        <header className="fl-workspace-heading">
          <div className="min-w-0 flex-1 basis-80">
            <h2 className="fl-page-title">Repostajes</h2>
            <p className="fl-supporting mt-3">Historial detallado de repostajes con cálculo por ciclo lleno a lleno.</p>
          </div>
          <div className="fl-fueling-tools">
            <Button type="button" disabled={submitting || !!deletingId} onClick={openCreateForm}><Plus aria-hidden="true" />Nuevo repostaje</Button>
            <Button type="button" variant="outline" size="icon" onClick={() => setExportTarget({ reportType: "fuelings", vehicle: selectedVehicle })} aria-label="Exportar repostajes" title="Exportar repostajes"><Download aria-hidden="true" /></Button>
            <Button type="button" variant="ghost" onClick={() => setShowHelp(true)} aria-label="Ayuda de repostaje" title="Ayuda de repostaje" className="w-11 px-0 sm:w-auto sm:px-4"><CircleHelp aria-hidden="true" /><span className="hidden sm:inline">Ayuda de repostaje</span></Button>
          </div>
        </header>
        <div className="fl-ledger-heading"><h3 className="fl-section-title">Historial</h3>{!loading && (!error || fuelings.length > 0) ? <p className="fl-ledger-count">{totalItems} registros</p> : null}</div>
        {error || historyError ? (
          <div role="alert" className="fl-feedback-error">
            <p>{error || historyError}</p>
            {historyError && <Button variant="outline" className="mt-3" onClick={() => reloadHistory()}>Reintentar</Button>}
          </div>
        ) : null}

        {loading ? (
          <div role="status" className="fl-expense-state">Cargando repostajes...</div>
        ) : fuelings.length === 0 && (error || historyError) ? null : fuelings.length === 0 ? (
          <div className="fl-expense-state">
            No hay repostajes registrados. ¡Crea uno para empezar!
          </div>
        ) : (
          <div className="fl-fueling-records">
            {currentFuelings.map((fueling) => {
              const liters = Number(fueling.liters) || 0;
              const distance = Number(fueling.distance) || 0;
              const priceTotal = Number(fueling.priceTotal) || 0;
              const rowQuantityUnit = getQuantityUnitForFuel(fueling.fuelType);
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
                  className="fl-fueling-record"
                >
                  <div className="fl-fueling-record-header">
                    <div>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatDateEs(fueling.date)}</p>
                      <p className="fl-supporting">{pricePerLiter} €/{rowQuantityUnit}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        disabled={submitting || !!deletingId} onClick={() => openEditForm(fueling)}
                        variant="outline" className="focus-visible:transition-none"
                      >
                        <Pencil aria-hidden="true" />Editar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDelete(fueling)}
                        pending={deletingId === fueling.id} pendingLabel="Borrando..." disabled={!!deletingId || submitting}
                        variant="ghost" className="text-destructive hover:text-destructive focus-visible:transition-none"
                      >
                        <Trash2 aria-hidden="true" />Borrar
                      </Button>
                    </div>
                  </div>

                  <div className="fl-fueling-data">
                    <div>
                      <p className="fl-data-label">Combustible</p>
                      <p className="fl-data-value">{formatFuelType(fueling.fuelType)}</p>
                    </div>

                    <div>
                      <p className="fl-data-label">Distancia</p>
                      <p className="fl-data-value">
                        {distance.toLocaleString("es-ES", { maximumFractionDigits: 1 })} {getOdometerUnit(selectedVehicle?.vehicleType)}
                      </p>
                    </div>

                    <div>
                      <p className="fl-data-label">Cantidad e importe</p>
                      <p className="fl-data-value">
                        {liters.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} {rowQuantityUnit}
                      </p>
                      <p className="fl-data-value text-primary">
                        {priceTotal.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €
                      </p>
                    </div>

                    <div>
                      <p className="fl-data-label">Repostaje</p>
                      <p className="fl-data-value">{formatRefuelingType(fueling.refueling)}</p>
                    </div>

                    <div>
                      <p className="fl-data-label">Estado del cálculo</p>
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
                        <p className="fl-supporting mt-2">Pendiente de cerrar ciclo</p>
                      ) : null}
                    </div>
                  </div>

                  <details className="fl-calculation-note">
                    <summary>Sobre este cálculo</summary>
                    {fueling.displayState === "partial" ? (
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
                  <p className="fl-supporting mt-2">
                    {fueling.displayState === "verified"
                      ? "Este valor cierra el ciclo anterior con la regla lleno a lleno."
                      : fueling.displayState === "partial"
                        ? "Este registro no muestra consumo. El cálculo real aparecerá cuando se cierre el ciclo con un lleno."
                        : "Este registro sirve como inicio de seguimiento y no genera consumo exacto."}
                  </p>
                  </details>

                  {fueling.notes ? (
                    <div className="fl-fueling-note">
                      {fueling.notes}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="fl-fueling-pagination">
            <Pagination aria-label="Páginas de repostajes">
              <PaginationContent className="flex-wrap justify-center overflow-visible">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-label="Página anterior"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(prev => prev - 1);
                    }}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50 text-muted-foreground"
                        : "cursor-pointer text-secondary-foreground hover:bg-secondary hover:text-foreground"
                    }
                  />
                </PaginationItem>

                {getPageNumbers(totalPages, currentPage).map((number) => (
                  <PaginationItem key={number}>
                    <PaginationLink
                      href="#"
                      aria-label={`Página ${number}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(number);
                      }}
                      isActive={currentPage === number}
                      className={
                        currentPage === number
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground border-transparent"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-label="Página siguiente"
                    aria-disabled={currentPage === totalPages}
                    tabIndex={currentPage === totalPages ? -1 : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50 text-muted-foreground"
                        : "cursor-pointer text-secondary-foreground hover:bg-secondary hover:text-foreground"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Surface>

      {showForm ? (
        <DialogFrame dialogRef={formDialogRef} titleId={formDialogTitleId} title={editingFueling ? "Editar repostaje" : "Nuevo repostaje"} description={`${selectedVehicle.brand} ${selectedVehicle.model}`} onClose={closeFormDialog} className="fl-fueling-dialog">
            <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-6">
              <FormErrorSummary message={formError?.message} fields={formError?.fields || {}} prefix="fueling" />
              <fieldset className="fl-vehicle-fieldset"><legend>Datos del repostaje</legend>
              <div className="fl-form-grid">
                <div>
                  <label htmlFor="fueling-date" className="fl-label mb-2 block">Fecha</label>
                  <Input
                    type="date"
                    {...fieldProps("date")}
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="fl-field"
                  />
                </div>
                <div>
                  <label htmlFor="fueling-odometer" className="fl-label mb-2 block">Odómetro ({getOdometerUnit(selectedVehicle?.vehicleType)})</label>
                  <Input
                    type="number"
                    {...fieldProps("odometer")}
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    className="fl-field"
                  />
                </div>
              </div>

              <div className="fl-form-grid">
                <div>
                  <label htmlFor="fueling-refueling" className="fl-label mb-2 block">Tipo de repostaje</label>
                  <CustomSelect
                    appearance="atlantic"
                    options={REFUELING_TYPE_OPTIONS}
                    {...fieldProps("refueling")}
                    name="refueling"
                    value={formData.refueling}
                    onChange={(value) => handleSelectChange("refueling", value)}
                    placeholder="Selecciona tipo"
                  />
                </div>
                <div>
                  <label htmlFor="fueling-fuelType" className="fl-label mb-2 block">Tipo de combustible</label>
                  <CustomSelect
                    appearance="atlantic"
                    options={fuelOptions.length > 0 ? fuelOptions : FUEL_TYPE_OPTIONS}
                    {...fieldProps("fuelType")}
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={(value) => handleSelectChange("fuelType", value)}
                    placeholder="Selecciona combustible"
                  />
                </div>
              </div>

              <div className="fl-fueling-quantities">
                <div>
                  <label htmlFor="fueling-distance" className="fl-label mb-2 block">Distancia ({getOdometerUnit(selectedVehicle?.vehicleType)})</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...fieldProps("distance")}
                    name="distance"
                    value={formData.distance}
                    onChange={handleInputChange}
                    required
                    className="fl-field"
                  />
                </div>
                <div>
                  <label htmlFor="fueling-liters" className="fl-label mb-2 block">Cantidad ({formQuantityUnit})</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...fieldProps("liters")}
                    name="liters"
                    value={formData.liters}
                    onChange={handleInputChange}
                    required
                    className="fl-field"
                  />
                </div>
                <div>
                  <label htmlFor="fueling-priceTotal" className="fl-label mb-2 block">Precio total (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...fieldProps("priceTotal")}
                    name="priceTotal"
                    value={formData.priceTotal}
                    onChange={handleInputChange}
                    required
                    className="fl-field"
                  />
                </div>
              </div>

              </fieldset>
              <fieldset className="fl-vehicle-fieldset"><legend>Conducción y condiciones</legend>
              <div className="fl-form-grid">
                <div>
                  <label htmlFor="fueling-drivingType" className="fl-label mb-2 block">Tipo de conducción</label>
                  <CustomSelect
                    appearance="atlantic"
                    options={DRIVING_TYPE_OPTIONS}
                    {...fieldProps("drivingType")}
                    name="drivingType"
                    value={formData.drivingType}
                    onChange={(value) => handleSelectChange("drivingType", value)}
                    placeholder="Selecciona tipo"
                  />
                </div>
                <div>
                  <label htmlFor="fueling-tireType" className="fl-label mb-2 block">Tipo de neumáticos</label>
                  <CustomSelect
                    appearance="atlantic"
                    options={TIRE_TYPE_OPTIONS}
                    {...fieldProps("tireType")}
                    name="tireType"
                    value={formData.tireType}
                    onChange={(value) => handleSelectChange("tireType", value)}
                    placeholder="Selecciona tipo"
                  />
                </div>
              </div>

              <div className="fl-form-grid">
                <div>
                  <label htmlFor="fueling-boardConsumption" className="fl-label mb-2 block">Consumo display (opcional) <span className="text-muted-foreground">({getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType)})</span></label>
                  <Input
                    type="number"
                    step="0.01"
                    {...fieldProps("boardConsumption")}
                    name="boardConsumption"
                    value={formData.boardConsumption}
                    onChange={handleInputChange}
                    className="fl-field"
                    placeholder={getConsumptionUnit(selectedVehicle?.vehicleType, selectedVehicle?.vehicleEnergyType)}
                  />
                </div>
                <div>
                  <label htmlFor="fueling-averageSpeed" className="fl-label mb-2 block">Velocidad promedio (opcional)</label>
                  <Input
                    type="number"
                    {...fieldProps("averageSpeed")}
                    name="averageSpeed"
                    value={formData.averageSpeed}
                    onChange={handleInputChange}
                    className="fl-field"
                    placeholder="km/h"
                  />
                </div>
              </div>

              <fieldset className="fl-driving-conditions"><legend className="fl-label mb-3">Condiciones del trayecto</legend><div className="fl-condition-grid">
                {drivingConditionOptions.map(({ key, label, hint, Icon }) => (
                  <label key={key} className="fl-condition-option">
                    <input type="checkbox" name={key} checked={formData[key]} onChange={handleInputChange} />
                    <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-medium"><Icon size={16} aria-hidden="true" />{label}</span><span className="fl-supporting block mt-1">{hint}</span></span>
                  </label>
                ))}
              </div></fieldset>
              </fieldset>

              <div>
                <label htmlFor="fueling-notes" className="fl-label mb-2 block">Notas (opcional)</label>
                <textarea
                  {...fieldProps("notes")}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="fl-field"
                  placeholder="Añade notas adicionales..."
                />
              </div>

              <div className="fl-dialog-footer"><Button type="button" variant="outline" onClick={closeFormDialog}>Cancelar</Button>
              <Button
                type="submit"
                pending={submitting} pendingLabel="Guardando..." disabled={submitting}
              >
                {editingFueling ? "Guardar cambios" : "Guardar repostaje"}
              </Button></div>
            </form>
        </DialogFrame>
      ) : null}

      {showHelp ? (
        <DialogFrame dialogRef={helpDialogRef} titleId={helpDialogTitleId} title="Cómo registrar el repostaje" onClose={closeHelpDialog}>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              La app calcula el consumo real con el método lleno a lleno. Los repostajes parciales sirven como tramos intermedios y se muestran como estimación hasta que llegue otro repostaje completo.
            </p>

            <div className="mt-5 space-y-3">
              {fuelingHelpItems.map((item) => (
                <div key={item.title} className="fl-help-item">
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

            <div className="fl-help-item mt-4 text-sm leading-6 text-secondary-foreground">
              Guarda siempre el odómetro total del vehículo cuando puedas. El parcial es útil para el tramo, pero el total es el que mejor evita errores de cálculo.
            </div>
        </DialogFrame>
      ) : null}

      {exportTarget ? (
        <ExportReportModal
          appearance="atlantic"
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
