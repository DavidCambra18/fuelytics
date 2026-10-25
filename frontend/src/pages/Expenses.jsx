import { localDate } from "../utils/localDate";
import useActionGuard from "../hooks/useActionGuard";
import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Download, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import { apiFetch, apiJson } from "../services/api";
import ExportReportModal from "../components/ExportReportModal";
import { Button } from "../components/ui/button";
import { Surface } from "../components/ui/surface";
import { Field, Input } from "../components/ui/field";
import { DialogFrame } from "../components/ui/dialog-frame";
import useDialogAccessibility from "../hooks/useDialogAccessibility";
import useHistoryPage from "../hooks/useHistoryPage";
import { getPageNumbers } from "../utils/pagination";
import FormErrorSummary from "../components/FormErrorSummary";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const EXPENSE_TYPE_OPTIONS = [
  { value: "maintenance", label: "Mantenimiento" },
  { value: "repair", label: "Reparación" },
  { value: "insurance", label: "Seguro" },
  { value: "fines", label: "Multas" },
  { value: "oil", label: "Aceite" },
  { value: "toll", label: "Peaje" },
  { value: "washing", label: "Lavado" },
  { value: "taxes", label: "Impuestos" },
  { value: "inspection", label: "Inspección" },
  { value: "homologation", label: "Homologación" },
  { value: "tuning", label: "Tuning" },
  { value: "tire_change", label: "Cambio de neumáticos" },
  { value: "financing", label: "Financiación" },
  { value: "spare_parts", label: "Repuestos" },
  { value: "parking", label: "Parking" },
  { value: "matriculation", label: "Matriculación" },
];

function formatExpenseType(type) {
  const option = EXPENSE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option ? option.label : type;
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

function createInitialFormData() {
  return {
    date: localDate(),
    type: "maintenance",
    description: "",
    cost: "",
    tireSetId: "",
    maintenanceReminderId: "",
  };
}

function toFormData(expense) {
  return {
    date: expense?.date || localDate(),
    type: expense?.type || "maintenance",
    description: expense?.description || "",
    cost: expense?.cost ?? "",
    tireSetId: expense?.tireSetId ?? "",
    maintenanceReminderId: expense?.maintenanceReminderId ?? "",
  };
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatMoney(value) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Expenses() {
  const { guard, isActive } = useActionGuard();
  const { selectedVehicle } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedReminder = Number(searchParams.get("reminderId"));
  const hasRequestedReminder = Number.isInteger(requestedReminder) && requestedReminder > 0;
  const currentYear = new Date().getFullYear();
  const { data: history, loading, error: historyError, setPage: setCurrentPage, reload: reloadHistory } = useHistoryPage("expenses", selectedVehicle?.id, currentYear);
  const expenses = history.content;
  const [availableTires, setAvailableTires] = useState([]);
  const [availableReminders, setAvailableReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState("");
  const [remindersAttempt, setRemindersAttempt] = useState(0);
  const retryingReminders = useRef(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState(null);
  const [showForm, setShowForm] = useState(hasRequestedReminder);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exportTarget, setExportTarget] = useState(null);
  const [formData, setFormData] = useState(() => ({ ...createInitialFormData(), maintenanceReminderId: hasRequestedReminder ? String(requestedReminder) : "" }));
  const itemsPerPage = 15;
  const { page: currentPage, totalPages, totalElements: totalItems } = history;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const fieldProps = (name) => ({
    id: `expense-${name}`,
    "aria-invalid": !!formError?.fields[name],
    "aria-describedby": formError?.fields[name] ? `expense-${name}-error` : undefined,
  });

  const exportDateRange = { startDate: history.startDate, endDate: history.endDate };

  useEffect(() => {
    const controller = new AbortController();
    const loadTires = async () => {
      if (!selectedVehicle?.id) return;
      try {
        const res = await apiFetch(`/api/vehicles/${selectedVehicle.id}/tires`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) setAvailableTires(data || []);
        }
      } catch (err) {
        if (controller.signal.aborted || err.name === "AbortError") return;
        console.error(err);
      }
    };
    loadTires();
    return () => controller.abort();
  }, [selectedVehicle?.id]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setRemindersLoading(true); setRemindersError("");
      try {
        const data = await apiJson(`/api/vehicles/${selectedVehicle.id}/reminders`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setAvailableReminders(data);
        setFormData((current) => {
          const selected = data.find((item) => String(item.id) === String(current.maintenanceReminderId));
          return selected && !current.description ? { ...current, description: selected.title } : current;
        });
      } catch (failure) {
        if (!controller.signal.aborted) setRemindersError(failure.message || "No se pudieron consultar los recordatorios");
      } finally { if (!controller.signal.aborted) setRemindersLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [selectedVehicle.id, remindersAttempt]);

  const openCreateForm = () => {
    setFormError(null);
    setEditingExpense(null);
    setFormData(createInitialFormData());
    setShowForm(true);
  };

  const openEditForm = (expense) => {
    setFormError(null);
    setEditingExpense(expense);
    setFormData(toFormData(expense));
    setShowForm(true);
  };

  const closeForm = () => {
    if (searchParams.has("reminderId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("reminderId");
      setSearchParams(nextParams, { replace: true });
    }
    setFormError(null);
    setShowForm(false);
    setEditingExpense(null);
    setFormData(createInitialFormData());
  };

  const { dialogRef: formDialogRef, titleId: formDialogTitleId, close: closeFormDialog } = useDialogAccessibility(showForm, closeForm);

  useEffect(() => {
    if (remindersLoading || !retryingReminders.current) return;
    retryingReminders.current = false;
    if (showForm) document.getElementById(remindersError ? "expense-reminders-retry" : "expense-maintenanceReminderId")?.focus({ preventScroll: true });
  }, [remindersLoading, remindersError, showForm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = guard(async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (formData.type === "maintenance" && (remindersLoading || remindersError)) {
      setFormError({ message: "Espera a que se carguen los recordatorios o pulsa Reintentar para consultarlos de nuevo.", fields: {} }); return;
    }
    if (formData.type === "maintenance" && formData.maintenanceReminderId && !availableReminders.some((item) =>
      String(item.id) === String(formData.maintenanceReminderId) && (item.status === "PENDING" || item.expenseId === editingExpense?.id))) {
      setFormError({ message: "El recordatorio ya no está disponible. Selecciona otro o guarda sin vincularlo.", fields: { maintenanceReminderId: "Selecciona un recordatorio disponible" } }); return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        vehicleId: selectedVehicle.id,
        date: formData.date,
        type: formData.type,
        description: formData.description,
        cost: toNumber(formData.cost),
        tireSetId: formData.type === "tire_change" && formData.tireSetId ? Number(formData.tireSetId) : null,
        maintenanceReminderId: formData.type === "maintenance" ? toNumber(formData.maintenanceReminderId) : null,
        nextMaintenanceKm: null,
        nextMaintenanceDate: null,
      };

      const response = await apiFetch(
        editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses",
        {
          method: editingExpense ? "PUT" : "POST",
          body: payload,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.message || "Error al guardar el gasto"), { fields: errorData.fields || {} });
      }

      const savedExpense = await response.json();
      if (!isActive()) return;
      setAvailableReminders((current) => current.map((reminder) => reminder.id === savedExpense.maintenanceReminderId
        ? { ...reminder, status: "COMPLETED", expenseId: savedExpense.id }
        : reminder.expenseId === savedExpense.id ? { ...reminder, status: "PENDING", expenseId: null } : reminder));
      reloadHistory(!editingExpense);
      closeForm();
    } catch (submitError) {
      if (!isActive()) return;
      setFormError({ message: submitError.message || "Error guardando gasto", fields: submitError.fields || {} });
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = guard(async (expense) => {
    const confirmed = window.confirm("¿Seguro que quieres borrar este gasto?");
    if (!confirmed) return;
    setDeletingId(expense.id);
    setError("");
    try {
      const response = await apiFetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al borrar el gasto");
      }
      if (!isActive()) return;
      setAvailableReminders((current) => current.map((reminder) => reminder.expenseId === expense.id
        ? { ...reminder, status: "PENDING", expenseId: null } : reminder));
      reloadHistory();
    } catch (deleteError) {
      if (!isActive()) return;
      setError(deleteError.message || "Error borrando gasto");
    } finally {
      setDeletingId(null);
    }
  });

  const totalCost = Number(history.summary.totalCost || 0);
  const monthSpan = Number(history.summary.monthSpan || 0);
  const monthlyAverageCost = monthSpan > 0 ? totalCost / monthSpan : 0;
  const yearlyCost = Number(history.summary.yearlyCost || 0);
  const currentExpenses = expenses;

  return (
    <section className="w-full min-w-0">
      <Surface as="article" className="fl-expenses">
        <header className="fl-expense-header">
          <div className="min-w-0">
            <h2 className="fl-page-title">Gastos</h2>
            <p className="fl-expense-context mt-2">{selectedVehicle.brand} {selectedVehicle.model}</p>
            <p className="fl-expense-intro">Historial de mantenimiento, seguros y otros gastos asociados a tu vehículo.</p>
          </div>
          <div className="fl-expense-actions">
            <Button type="button" disabled={submitting || !!deletingId} onClick={openCreateForm}><Plus aria-hidden="true" />Nuevo gasto</Button>
            <Button type="button" variant="outline" size="icon" onClick={() => setExportTarget({ reportType: "expenses", vehicle: selectedVehicle })} aria-label="Exportar gastos" title="Exportar gastos">
              <Download aria-hidden="true" />
            </Button>
          </div>
        </header>

        {(error || historyError) && <div role="alert" className="fl-expense-error"><p>{error || historyError}</p>{historyError && <Button variant="outline" className="mt-3" onClick={() => reloadHistory()}>Reintentar</Button>}</div>}
        {loading ? (
          <div role="status" className="fl-expense-state">Cargando gastos...</div>
        ) : expenses.length === 0 ? ((error || historyError) ? null : (
          <Surface variant="inset" className="fl-expense-state">
            <ReceiptText aria-hidden="true" />
            <h3>No hay gastos registrados</h3>
            <p className="text-sm leading-6">¡Crea uno para empezar!</p>
          </Surface>
        )) : (
          <>
            <dl className="fl-expense-summary" aria-label="Resumen de gastos">
              <div><dt>Gasto total</dt><dd>{formatMoney(totalCost)} <span>€</span></dd></div>
              <div><dt>Gasto mensual promedio</dt><dd>{formatMoney(monthlyAverageCost)} <span>€</span></dd></div>
              <div><dt>Gasto anual</dt><dd>{formatMoney(yearlyCost)} <span>€</span></dd></div>
            </dl>
            <div className="fl-ledger-heading">
              <h3 className="fl-section-title">Historial</h3>
              <p className="fl-ledger-count">{totalItems} {totalItems === 1 ? "registro" : "registros"}</p>
            </div>
            <table className="fl-ledger">
              <caption className="sr-only">Historial de gastos de {selectedVehicle.brand} {selectedVehicle.model}</caption>
              <thead><tr><th scope="col">Fecha</th><th scope="col">Categoría</th><th scope="col">Descripción</th><th scope="col">Importe</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {currentExpenses.map((expense) => {
                  const cost = Number(expense.cost) || 0;
                  return (
                    <tr key={expense.id}>
                      <td className="fl-ledger-date"><time dateTime={expense.date}>{formatDateEs(expense.date)}</time></td>
                      <td className="fl-ledger-category">{formatExpenseType(expense.type)}</td>
                      <td className="fl-ledger-description">
                        {expense.description || "Sin descripción"}
                        {expense.type === "tire_change" && expense.tireSetId && (() => {
                          const tire = availableTires.find(t => t.id === expense.tireSetId);
                          if (!tire) return null;
                          return <span className="fl-tire-note">{tire.brand} {tire.model} - {tire.size} ({tire.axle === 'FRONT' ? 'Delantero' : 'Trasero'})</span>;
                        })()}
                      </td>
                      <td className="fl-ledger-amount">{formatMoney(cost)} €</td>
                      <td>
                        <div className="fl-ledger-actions">
                          <Button type="button" variant="outline" className="border-[var(--border-subtle)] bg-white/[0.025] px-3 hover:bg-white/[0.06] focus-visible:transition-none" disabled={submitting || !!deletingId} onClick={() => openEditForm(expense)} aria-label={`Editar gasto del ${formatDateEs(expense.date)}`}>
                            <Pencil aria-hidden="true" />Editar
                          </Button>
                          <Button type="button" variant="ghost" className="px-3 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:transition-none" onClick={() => handleDelete(expense)} pending={deletingId === expense.id} pendingLabel="Borrando..." disabled={!!deletingId || submitting} aria-busy={deletingId === expense.id} aria-label={`Borrar gasto del ${formatDateEs(expense.date)}`}>
                            <Trash2 aria-hidden="true" />
                            Borrar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        {totalPages > 1 && (
          <div className="fl-expense-pagination">
            <p>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems}</p>
            <Pagination aria-label="Páginas del historial de gastos">
              <PaginationContent className="flex-wrap justify-center overflow-visible">
                <PaginationItem>
                  <PaginationPrevious href="#" aria-label="Página anterior" aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined} onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(prev => prev - 1);
                  }} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                {getPageNumbers(totalPages, currentPage).map((number) => (
                  <PaginationItem key={number}>
                    <PaginationLink href="#" aria-label={`Página ${number}`} onClick={(e) => { e.preventDefault(); setCurrentPage(number); }} isActive={currentPage === number}>
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" aria-label="Página siguiente" aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined} onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                  }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Surface>

      {showForm && (
        <DialogFrame dialogRef={formDialogRef} titleId={formDialogTitleId} title={editingExpense ? "Editar gasto" : "Nuevo gasto"} description={`${selectedVehicle.brand} ${selectedVehicle.model}`} onClose={closeFormDialog}>
          <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-5">
            <FormErrorSummary message={formError?.message} fields={formError?.fields || {}} prefix="expense" />
            <div className="fl-form-grid">
              <Field id="expense-date" label="Fecha">
                <Input type="date" {...fieldProps("date")} name="date" value={formData.date} onChange={handleInputChange} required />
              </Field>
              <Field id="expense-type" label="Categoría">
                <CustomSelect appearance="atlantic" options={EXPENSE_TYPE_OPTIONS} {...fieldProps("type")} name="type" value={formData.type} onChange={(value) => handleSelectChange("type", value)} placeholder="Selecciona categoría" />
              </Field>
            </div>
            {formData.type === "tire_change" && (
              <Field id="expense-tireSetId" label="Neumático montado">
                <CustomSelect appearance="atlantic" options={[
                  { value: "", label: "Ninguno / Gasto general" },
                  ...availableTires.map(t => ({ value: t.id, label: `${t.brand} ${t.model} - ${t.size} (${t.axle === 'FRONT' ? 'Delantero' : 'Trasero'}) | ${formatDateEs(t.installationDate)} - ${t.installationOdometer.toLocaleString()} km` }))
                ]} {...fieldProps("tireSetId")} name="tireSetId" value={formData.tireSetId} onChange={(value) => handleSelectChange("tireSetId", value)} placeholder="Selecciona el juego de neumáticos" />
              </Field>
            )}
            <Field id="expense-description" label="Descripción">
              <Input type="text" {...fieldProps("description")} name="description" value={formData.description} onChange={handleInputChange} placeholder="Ej: Revisión anual, Pastillas de freno, etc." />
            </Field>
            <Field id="expense-cost" label="Coste (€)">
              <Input type="number" step="0.01" {...fieldProps("cost")} name="cost" value={formData.cost} onChange={handleInputChange} required placeholder="0.00" className="fl-field-amount tabular-nums" />
            </Field>
            {formData.type === "maintenance" ? <div className="space-y-3">
              <Field id="expense-maintenanceReminderId" label="Recordatorio asociado (opcional)">
                <CustomSelect appearance="atlantic" {...fieldProps("maintenanceReminderId")} value={formData.maintenanceReminderId}
                  onChange={(value) => handleSelectChange("maintenanceReminderId", value)} disabled={remindersLoading || !!remindersError}
                  options={[{ value: "", label: "Sin vincular a un recordatorio" }, ...availableReminders.filter((item) => item.status === "PENDING" || item.expenseId === editingExpense?.id).map((item) => ({ value: item.id, label: item.title }))]} />
              </Field>
              {remindersError ? <div><p role="alert" className="fl-feedback-error">{remindersError}</p><Button id="expense-reminders-retry" type="button" variant="outline" className="mt-3" onClick={() => { retryingReminders.current = true; setRemindersAttempt((current) => current + 1); }} disabled={submitting}>Reintentar</Button></div> : remindersLoading ? <p role="status" className="fl-supporting">Consultando recordatorios...</p> : <p className="fl-supporting">Al guardar, el recordatorio seleccionado quedará realizado. Los demás seguirán pendientes.</p>}
              <Button asChild variant="link"><Link to={`/vehicles/${selectedVehicle.id}/reminders`}>Gestionar recordatorios</Link></Button>
            </div> : formData.maintenanceReminderId ? <p className="fl-supporting">Al guardar con esta categoría se desvinculará el recordatorio y volverá a estar pendiente.</p> : null}
            <div className="fl-dialog-footer">
              <Button type="button" variant="outline" onClick={closeFormDialog}>Cancelar</Button>
              <Button type="submit" pending={submitting} pendingLabel="Guardando..." disabled={submitting || (formData.type === "maintenance" && (remindersLoading || !!remindersError))} aria-busy={submitting}>
                {editingExpense ? "Guardar cambios" : "Guardar gasto"}
              </Button>
            </div>
          </form>
        </DialogFrame>
      )}
      {exportTarget && (
        <ExportReportModal open={Boolean(exportTarget)} reportType={exportTarget.reportType} vehicle={exportTarget.vehicle} defaultStartDate={exportDateRange.startDate || ""} defaultEndDate={exportDateRange.endDate || ""} onClose={() => setExportTarget(null)} />
      )}
    </section>
  );
}
