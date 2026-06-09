import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download } from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import { apiFetch } from "../services/api";
import ExportReportModal from "../components/ExportReportModal";
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
    date: new Date().toISOString().split("T")[0],
    type: "maintenance",
    description: "",
    cost: "",
    tireSetId: "",
    nextMaintenanceKm: "",
    nextMaintenanceDate: "",
  };
}

function toFormData(expense) {
  return {
    date: expense?.date || new Date().toISOString().split("T")[0],
    type: expense?.type || "maintenance",
    description: expense?.description || "",
    cost: expense?.cost ?? "",
    tireSetId: expense?.tireSetId ?? "",
    nextMaintenanceKm: expense?.nextMaintenanceKm ?? "",
    nextMaintenanceDate: expense?.nextMaintenanceDate || "",
  };
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseExpenseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMonthSpan(expensesList) {
  const dates = expensesList
    .map((expense) => parseExpenseDate(expense.date))
    .filter(Boolean)
    .sort((left, right) => left - right);

  if (dates.length === 0) return 0;
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth()) + 1;
}

export default function Expenses() {
  const { selectedVehicle } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [availableTires, setAvailableTires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exportTarget, setExportTarget] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const now = new Date();
  const currentYear = now.getFullYear();

  const exportDateRange = useMemo(() => {
    if (expenses.length === 0) return {};
    const dates = expenses.map((e) => e.date).filter(Boolean).sort();
    if (dates.length === 0) return {};
    return { startDate: dates[0], endDate: dates[dates.length - 1] };
  }, [expenses]);

  useEffect(() => {
    setFormData(createInitialFormData());
  }, [selectedVehicle]);

  useEffect(() => {
    const loadExpenses = async () => {
      if (!selectedVehicle?.id) return;
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch(`/api/expenses/vehicle/${selectedVehicle.id}`);
        if (!response.ok) throw new Error("No se pudieron cargar los gastos");
        const data = await response.json();
        setExpenses(data || []);
      } catch (fetchError) {
        setError(fetchError.message || "Error cargando gastos");
      } finally {
        setLoading(false);
      }
    };
    loadExpenses();
  }, [selectedVehicle?.id]);

  useEffect(() => {
    const loadTires = async () => {
      if (!selectedVehicle?.id) return;
      try {
        const res = await apiFetch(`/api/vehicles/${selectedVehicle.id}/tires`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTires(data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadTires();
  }, [selectedVehicle?.id]);

  const openCreateForm = () => {
    setEditingExpense(null);
    setFormData(createInitialFormData());
    setShowForm(true);
  };

  const openEditForm = (expense) => {
    setEditingExpense(expense);
    setFormData(toFormData(expense));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData(createInitialFormData());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        vehicleId: selectedVehicle.id,
        date: formData.date,
        type: formData.type,
        description: formData.description,
        cost: toNumber(formData.cost),
        tireSetId: formData.type === "tire_change" && formData.tireSetId ? Number(formData.tireSetId) : null,
        nextMaintenanceKm: toNumber(formData.nextMaintenanceKm),
        nextMaintenanceDate: formData.nextMaintenanceDate || null,
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
        throw new Error(errorData.message || "Error al guardar el gasto");
      }

      const savedExpense = await response.json();
      setExpenses((current) =>
        editingExpense
          ? current.map((item) => (item.id === savedExpense.id ? savedExpense : item))
          : [savedExpense, ...current]
      );
      closeForm();
    } catch (submitError) {
      setError(submitError.message || "Error guardando gasto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expense) => {
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
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (deleteError) {
      setError(deleteError.message || "Error borrando gasto");
    } finally {
      setDeletingId(null);
    }
  };

  const totalCost = expenses.reduce((acc, expense) => acc + Number(expense.cost || 0), 0);
  const monthSpan = getMonthSpan(expenses);
  const monthlyAverageCost = monthSpan > 0 ? totalCost / monthSpan : 0;
  const yearlyCost = expenses.reduce((acc, expense) => {
    const expenseDate = parseExpenseDate(expense.date);
    if (!expenseDate) return acc;
    if (expenseDate.getFullYear() === currentYear) return acc + Number(expense.cost || 0);
    return acc;
  }, 0);

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="w-full space-y-6">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-2 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-semibold">Gastos</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Costes de {selectedVehicle.brand} {selectedVehicle.model}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 max-w-2xl">
            Historial de mantenimiento, seguros y otros gastos asociados a tu vehículo.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={openCreateForm}
            className="inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            + Nuevo gasto
          </button>
          <button
            type="button"
            onClick={() => setExportTarget({ reportType: "expenses", vehicle: selectedVehicle })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-amber-300/40 hover:bg-white/10 hover:text-white"
            aria-label="Exportar gastos"
            title="Exportar gastos"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-400">Cargando...</div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            No hay gastos registrados. ¡Crea uno para empezar!
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-amber-400 font-semibold">Gasto total</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatMoney(totalCost)} €</p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">Gasto mensual promedio</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatMoney(monthlyAverageCost)} €</p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">Gasto anual</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatMoney(yearlyCost)} €</p>
              </div>
            </div>

            <div className="space-y-3">
              {currentExpenses.map((expense) => {
                const cost = Number(expense.cost) || 0;
                return (
                  <div
                    key={expense.id}
                    className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4 transition hover:border-slate-600/50"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{formatDateEs(expense.date)}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatExpenseType(expense.type)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(expense)}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-300/40 hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
                          disabled={deletingId === expense.id}
                          className="rounded-full border border-rose-400/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-300/40 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === expense.id ? "Borrando..." : "Borrar"}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Coste</p>
                        <p className="mt-1 text-xl font-bold text-amber-400">
                          {cost.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Categoría</p>
                        <p className="mt-1 text-white font-medium">{formatExpenseType(expense.type)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Descripción</p>
                        <p className="mt-1 text-white font-medium">{expense.description || "Sin descripción"}</p>

                        {expense.type === "tire_change" && expense.tireSetId && (
                          (() => {
                            const tire = availableTires.find(t => t.id === expense.tireSetId);
                            if (!tire) return null;

                            return (
                              <div className="mt-2">
                                <span className="inline-block rounded-md border border-teal-500/20 bg-teal-500/10 px-2 py-1 text-xs font-medium text-teal-300">
                                  {tire.brand} {tire.model} - {tire.size} ({tire.axle === 'FRONT' ? 'Delantero' : 'Trasero'})
                                </span>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {totalPages > 1 && (
          <div className="mt-8 mb-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(prev => prev - 1);
                    }}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50 text-slate-500"
                        : "cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white"
                    }
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={currentPage === i + 1}
                      className={
                        currentPage === i + 1
                          ? "bg-amber-600 text-white hover:bg-amber-700 hover:text-white border-transparent"
                          : "text-slate-400 hover:bg-white/10 hover:text-white"
                      }
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50 text-slate-500"
                        : "cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </article>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-semibold">Gastos</p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {editingExpense ? "Editar gasto" : "Nuevo gasto"}
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Categoría</label>
                  <CustomSelect
                    options={EXPENSE_TYPE_OPTIONS}
                    value={formData.type}
                    onChange={(value) => handleSelectChange("type", value)}
                    placeholder="Selecciona categoría"
                  />
                </div>
              </div>

              {formData.type === "tire_change" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Neumático montado</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Ninguno / Gasto general" },
                      ...availableTires.map(t => ({
                        value: t.id,
                        label: `${t.brand} ${t.model} - ${t.size} (${t.axle === 'FRONT' ? 'Delantero' : 'Trasero'}) | ${formatDateEs(t.installationDate)} - ${t.installationOdometer.toLocaleString()} km`
                      }))
                    ]}
                    value={formData.tireSetId}
                    onChange={(value) => handleSelectChange("tireSetId", value)}
                    placeholder="Selecciona el juego de neumáticos"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Descripción</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ej: Revisión anual, Pastillas de freno, etc."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Coste (€)</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              {formData.type === "maintenance" && (
                <div className="mt-2 border-t border-white/5 pt-4">
                  <h4 className="mb-4 text-sm font-medium text-slate-300">Programar próxima revisión</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Kilometraje previsto</label>
                      <input
                        type="number"
                        name="nextMaintenanceKm"
                        value={formData.nextMaintenanceKm}
                        onChange={handleInputChange}
                        placeholder="Ej: 330000"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Fecha estimada</label>
                      <input
                        type="date"
                        name="nextMaintenanceDate"
                        value={formData.nextMaintenanceDate}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? "Guardando..." : editingExpense ? "Guardar cambios" : "Guardar gasto"}
              </button>
            </form>
          </div>
        </div>
      )}

      {exportTarget && (
        <ExportReportModal
          open={Boolean(exportTarget)}
          reportType={exportTarget.reportType}
          vehicle={exportTarget.vehicle}
          defaultStartDate={exportDateRange.startDate || ""}
          defaultEndDate={exportDateRange.endDate || ""}
          onClose={() => setExportTarget(null)}
        />
      )}
    </section>
  );
}