import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CustomSelect from "../components/CustomSelect";

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
  };
}

function toFormData(expense) {
  return {
    date: expense?.date || new Date().toISOString().split("T")[0],
    type: expense?.type || "maintenance",
    description: expense?.description || "",
    cost: expense?.cost ?? "",
  };
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseExpenseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value) {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function Expenses() {
  const { selectedVehicle } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  useEffect(() => {
    setFormData(createInitialFormData());
  }, [selectedVehicle]);

  useEffect(() => {
    const loadExpenses = async () => {
      if (!selectedVehicle?.id) return;

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/expenses/vehicle/${selectedVehicle.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los gastos");
        }

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

    setFormData((current) => ({
      ...current,
      [name]: value,
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
        type: formData.type,
        description: formData.description,
        cost: toNumber(formData.cost),
      };

      const response = await fetch(
        editingExpense
          ? `http://localhost:8080/api/expenses/${editingExpense.id}`
          : "http://localhost:8080/api/expenses",
        {
          method: editingExpense ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al guardar el gasto");
      }

      const savedExpense = await response.json();

      setExpenses((currentExpenses) =>
        editingExpense
          ? currentExpenses.map((item) => (item.id === savedExpense.id ? savedExpense : item))
          : [savedExpense, ...currentExpenses]
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

    if (!confirmed) {
      return;
    }

    setDeletingId(expense.id);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/expenses/${expense.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al borrar el gasto");
      }

      setExpenses((currentExpenses) => currentExpenses.filter((item) => item.id !== expense.id));
    } catch (deleteError) {
      setError(deleteError.message || "Error borrando gasto");
    } finally {
      setDeletingId(null);
    }
  };

  const totalCost = expenses.reduce((acc, expense) => acc + Number(expense.cost || 0), 0);
  const monthlyCost = expenses.reduce((acc, expense) => {
    const expenseDate = parseExpenseDate(expense.date);

    if (!expenseDate) {
      return acc;
    }

    if (expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth) {
      return acc + Number(expense.cost || 0);
    }

    return acc;
  }, 0);
  const yearlyCost = expenses.reduce((acc, expense) => {
    const expenseDate = parseExpenseDate(expense.date);

    if (!expenseDate) {
      return acc;
    }

    if (expenseDate.getFullYear() === currentYear) {
      return acc + Number(expense.cost || 0);
    }

    return acc;
  }, 0);

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

        <button
          onClick={openCreateForm}
          className="mb-6 inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          + Nuevo gasto
        </button>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

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
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatMoney(totalCost)} €
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">Gasto mensual</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatMoney(monthlyCost)} €
                </p>
              </div>

              <div className="rounded-xl border border-slate-700/50 bg-slate-950/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">Gasto anual</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatMoney(yearlyCost)} €
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {expenses.map((expense) => {
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
                          {cost.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} €
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Categoría</p>
                        <p className="mt-1 text-white font-medium">{formatExpenseType(expense.type)}</p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">Descripción</p>
                        <p className="mt-1 text-white font-medium">
                          {expense.description || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </article>

      {showForm ? (
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
      ) : null}
    </section>
  );
}
