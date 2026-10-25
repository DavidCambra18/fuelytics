import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Plus, Pencil, Link2, Unlink, Trash2 } from "lucide-react";
import useActionGuard from "../hooks/useActionGuard";
import useDialogAccessibility from "../hooks/useDialogAccessibility";
import { apiJson, apiFetch } from "../services/api";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/field";
import { DialogFrame } from "../components/ui/dialog-frame";
import CustomSelect from "../components/CustomSelect";
import FormErrorSummary from "../components/FormErrorSummary";

const blank = () => ({ title: "", notes: "", targetOdometer: "", targetDate: "" });
const date = (value) => value ? new Intl.DateTimeFormat("es-ES").format(new Date(`${value}T00:00:00`)) : "Sin fecha";
const money = (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);

export default function Reminders() {
  const { selectedVehicle } = useOutletContext();
  const vehicleId = selectedVehicle.id;
  const { guard, isActive } = useActionGuard();
  const [items, setItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("PENDING");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank);
  const [expenseId, setExpenseId] = useState("");
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const noticeRef = useRef(null);
  const headingRef = useRef(null);
  const retryButtonRef = useRef(null);
  const retrying = useRef(false);
  const close = () => { setMode(null); setFormError(null); };
  const { dialogRef, titleId, close: closeDialog } = useDialogAccessibility(mode !== null, close);
  useEffect(() => {
    if (notice && mode === null) noticeRef.current?.focus({ preventScroll: true });
  }, [notice, mode]);
  useEffect(() => {
    if (loading || !retrying.current) return;
    retrying.current = false;
    (error ? retryButtonRef : headingRef).current?.focus({ preventScroll: true });
  }, [loading, error]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      if (!retrying.current) setError("");
      try {
        const [reminders, history] = await Promise.all([
          apiJson(`/api/vehicles/${vehicleId}/reminders`, { signal: controller.signal }),
          apiJson(`/api/expenses/vehicle/${vehicleId}`, { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) { setItems(reminders); setExpenses(history); setError(""); }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message || "No se pudieron cargar los recordatorios");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [vehicleId, attempt]);

  const open = (nextMode, reminder = null) => {
    setSelected(reminder);
    setForm(reminder ? { title: reminder.title, notes: reminder.notes || "", targetOdometer: reminder.targetOdometer ?? "", targetDate: reminder.targetDate || "" } : blank());
    setExpenseId(""); setFormError(null); setMode(nextMode);
  };
  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };
  const replace = (reminder) => setItems((current) => current.some((item) => item.id === reminder.id)
    ? current.map((item) => item.id === reminder.id ? reminder : item) : [reminder, ...current]);

  const submit = guard(async (event) => {
    event.preventDefault();
    if (mode === "edit" && !form.targetOdometer && !form.targetDate) {
      setFormError({ message: "Indica el odómetro previsto, una fecha o ambos.", fields: {} }); return;
    }
    setSaving(true); setFormError(null); setNotice("");
    try {
      const path = `/api/vehicles/${vehicleId}/reminders`;
      const reminder = mode === "link"
        ? await apiJson(`${path}/${selected.id}/completion`, { method: "PUT", body: { expenseId: Number(expenseId) } })
        : await apiJson(selected ? `${path}/${selected.id}` : path, { method: selected ? "PUT" : "POST", body: {
          ...form, targetOdometer: form.targetOdometer === "" ? null : Number(form.targetOdometer), targetDate: form.targetDate || null,
        } });
      if (!isActive()) return;
      replace(reminder); close();
      setNotice(mode === "link" ? "Mantenimiento vinculado. El recordatorio está realizado." : "Recordatorio guardado.");
    } catch (failure) {
      if (isActive()) setFormError({ message: failure.message, fields: failure.fields || {} });
    } finally { if (isActive()) setSaving(false); }
  });

  const remove = guard(async (reminder) => {
    if (!window.confirm("¿Borrar este recordatorio? El gasto vinculado, si lo hay, se conservará.")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await apiFetch(`/api/vehicles/${vehicleId}/reminders/${reminder.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("No se pudo borrar el recordatorio");
      if (isActive()) { setItems((current) => current.filter((item) => item.id !== reminder.id)); setNotice("Recordatorio borrado. Los gastos se conservan."); }
    } catch (failure) { if (isActive()) setError(failure.message); }
    finally { if (isActive()) setSaving(false); }
  });
  const unlink = guard(async (reminder) => {
    if (!window.confirm("¿Desvincular este mantenimiento? El gasto se conservará y el recordatorio volverá a estar pendiente.")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const updated = await apiJson(`/api/vehicles/${vehicleId}/reminders/${reminder.id}/completion`, { method: "PUT", body: { expenseId: null } });
      if (isActive()) { replace(updated); setNotice("Mantenimiento desvinculado. El recordatorio vuelve a estar pendiente."); }
    } catch (failure) { if (isActive()) setError(failure.message); }
    finally { if (isActive()) setSaving(false); }
  });

  const shown = items.filter((item) => filter === "ALL" || item.status === filter);
  const eligibleExpenses = expenses.filter((expense) => expense.type === "maintenance" && !items.some((item) => item.expenseId === expense.id));
  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  const props = (name) => ({ id: `reminder-${name}`, "aria-invalid": !!formError?.fields[name], "aria-describedby": formError?.fields[name] ? `reminder-${name}-error` : undefined });
  return <Surface as="section" className="fl-workspace">
    <header className="fl-workspace-heading">
      <div><h2 ref={headingRef} tabIndex={-1} className="fl-page-title focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]">Recordatorios</h2><p className="fl-supporting mt-3">Planifica las revisiones y vincula el gasto cuando realices el mantenimiento. Cada recordatorio se gestiona por separado.</p></div>
      <Button onClick={() => open("edit")} disabled={loading || saving || (!!error && !items.length)}><Plus aria-hidden="true" />Nuevo recordatorio</Button>
    </header>
    {notice ? <p ref={noticeRef} role="status" tabIndex={-1} className="fl-supporting mb-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]">{notice}</p> : null}
    {error ? <div className="mb-5"><p role="alert" className="fl-feedback-error">{error}</p><Button ref={retryButtonRef} variant="outline" className="mt-3" onClick={() => { retrying.current = true; setAttempt((current) => current + 1); }} disabled={saving || loading}>Reintentar</Button></div> : null}
    {loading ? <p role="status" className="fl-supporting py-8">Cargando recordatorios...</p> : error && !items.length ? null : <>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Estado de los recordatorios">
        {[["PENDING", `Pendientes (${pendingCount})`], ["COMPLETED", `Realizados (${items.length - pendingCount})`], ["ALL", "Todos"]].map(([value, label]) => <Button key={value} variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}
      </div>
      {!shown.length ? <p role="status" className="fl-supporting py-8">No hay recordatorios en este estado.</p> : <div className="divide-y divide-border">
        {shown.map((reminder) => <article key={reminder.id} className="space-y-4 py-6 first:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 break-words text-lg font-semibold">{reminder.title}</h3><span className={`text-sm font-medium ${reminder.status === "COMPLETED" ? "text-primary" : reminder.urgency === "CRITICAL" ? "text-rose-300" : reminder.urgency === "WARNING" ? "text-amber-200" : "text-muted-foreground"}`}>{reminder.status === "COMPLETED" ? "Realizado" : reminder.urgency === "CRITICAL" ? "Urgente" : reminder.urgency === "WARNING" ? "Próximo" : "Programado"}</span></div>
          {reminder.notes ? <p className="fl-supporting whitespace-pre-wrap break-words">{reminder.notes}</p> : null}
          <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Odómetro previsto</dt><dd className="mt-1 tabular-nums">{reminder.targetOdometer == null ? "Sin límite por km" : `${reminder.targetOdometer.toLocaleString("es-ES")} km`}</dd></div><div><dt className="text-muted-foreground">Fecha prevista</dt><dd className="mt-1">{date(reminder.targetDate)}</dd></div></dl>
          {reminder.status === "COMPLETED" ? <p className="fl-supporting">Gasto #{reminder.expenseId} · {date(reminder.completedDate)} · {money(reminder.completedCost)}</p> : <p className="fl-supporting">{reminder.remainingKm == null ? "" : reminder.remainingKm <= 0 ? `Vencido por ${Math.abs(reminder.remainingKm).toLocaleString("es-ES")} km. ` : `En ${reminder.remainingKm.toLocaleString("es-ES")} km. `}{reminder.remainingDays == null ? "" : reminder.remainingDays < 0 ? `Fecha vencida hace ${Math.abs(reminder.remainingDays)} días.` : `En ${reminder.remainingDays} días.`}</p>}
          <div className="flex flex-wrap gap-2">
            {reminder.status === "PENDING" ? <><Button asChild><Link to={`/vehicles/${vehicleId}/expenses?reminderId=${reminder.id}`} aria-disabled={saving || undefined} tabIndex={saving ? -1 : undefined} onClick={(event) => { if (saving) event.preventDefault(); }}>Registrar mantenimiento</Link></Button><Button variant="outline" onClick={() => open("link", reminder)} disabled={saving}><Link2 aria-hidden="true" />Vincular gasto</Button><Button variant="ghost" onClick={() => open("edit", reminder)} disabled={saving} aria-label={`Editar recordatorio: ${reminder.title}`}><Pencil aria-hidden="true" />Editar</Button></> : <Button variant="outline" onClick={() => unlink(reminder)} disabled={saving}><Unlink aria-hidden="true" />Desvincular mantenimiento</Button>}
            <Button variant="ghost" className="text-destructive" onClick={() => remove(reminder)} disabled={saving} aria-label={`Borrar recordatorio: ${reminder.title}`}><Trash2 aria-hidden="true" />Borrar</Button>
          </div>
        </article>)}
      </div>}
    </>}
    {mode ? <DialogFrame dialogRef={dialogRef} titleId={titleId} title={mode === "link" ? "Vincular mantenimiento" : selected ? "Editar recordatorio" : "Nuevo recordatorio"} description={selected?.title || "Indica cuándo debe realizarse la revisión."} onClose={closeDialog}>
      <form onSubmit={submit} className="space-y-5" aria-busy={saving}>
        <FormErrorSummary message={formError?.message} fields={formError?.fields || {}} prefix="reminder" />
        {mode === "link" ? <>
          <p className="fl-supporting">Solo se muestran gastos de mantenimiento de este vehículo que no estén vinculados a otro recordatorio.</p>
          <Field id="reminder-expenseId" label="Mantenimiento realizado"><CustomSelect appearance="atlantic" {...props("expenseId")} value={expenseId} onChange={setExpenseId} options={eligibleExpenses.map((expense) => ({ value: expense.id, label: `${date(expense.date)} · ${expense.description || "Mantenimiento"} · ${money(expense.cost)}` }))} placeholder="Selecciona un gasto" required /></Field>
          {!eligibleExpenses.length ? <p className="fl-supporting">No hay gastos disponibles. Puedes registrar uno desde Gastos.</p> : null}
        </> : <>
          <Field id="reminder-title" label="Título"><Input {...props("title")} name="title" required maxLength={120} value={form.title} onChange={update} /></Field>
          <Field id="reminder-notes" label="Notas (opcional)"><textarea {...props("notes")} name="notes" className="fl-field min-h-24" maxLength={500} value={form.notes} onChange={update} /></Field>
          <Field id="reminder-targetOdometer" label="Odómetro previsto (km)"><Input {...props("targetOdometer")} name="targetOdometer" type="number" min="1" max="2147483647" step="1" value={form.targetOdometer} onChange={update} /></Field>
          <Field id="reminder-targetDate" label="Fecha prevista"><Input {...props("targetDate")} name="targetDate" type="date" value={form.targetDate} onChange={update} /></Field>
          <p className="fl-supporting">Indica el odómetro total previsto, una fecha o ambos. Se avisará cuando se acerque cualquiera de los dos límites.</p>
        </>}
        <div className="fl-dialog-footer"><Button variant="outline" type="button" onClick={closeDialog}>Cancelar</Button><Button type="submit" pending={saving} pendingLabel="Guardando..." disabled={saving || (mode === "link" && !expenseId)}>{mode === "link" ? "Vincular mantenimiento" : "Guardar recordatorio"}</Button></div>
      </form>
    </DialogFrame> : null}
  </Surface>;
}
