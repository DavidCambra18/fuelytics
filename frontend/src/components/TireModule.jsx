import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Ban, Plus, Disc, AlertTriangle } from "lucide-react";
import { apiJson } from "../services/api";
import { TIRE_AXLE_OPTIONS } from "../utils/vehicleLabels";
import CustomSelect from "./CustomSelect";

function createInitialFormData(odometer) {
    return {
        brand: "",
        model: "",
        size: "",
        width: "",
        profile: "",
        rim: "",
        axle: "FRONT",
        installationDate: new Date().toISOString().split("T")[0],
        installationOdometer: odometer || "",
    };
}

export default function TiresModule() {
    const { selectedVehicle } = useOutletContext();
    const vehicleId = selectedVehicle?.id;
    const latestOdometer = selectedVehicle?.odometer;

    const [tires, setTires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState(() => createInitialFormData(latestOdometer));

    const loadTires = useCallback(async (signal) => {
        setLoading(true);
        setError("");
        try {
            const data = await apiJson(`/api/vehicles/${vehicleId}/tires`, { signal });
            if (!signal?.aborted) setTires(data || []);
        } catch (loadError) {
            if (!signal?.aborted) setError(loadError.message || "Error cargando neumáticos");
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [vehicleId]);

    useEffect(() => {
        if (!vehicleId) return undefined;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => loadTires(controller.signal), 0);
        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [loadTires, vehicleId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (saving) return;
        const fullSize = `${formData.width}/${formData.profile} R${formData.rim}`;

        const dataToSend = {
            brand: formData.brand,
            model: formData.model,
            size: fullSize,
            axle: formData.axle,
            installationDate: formData.installationDate,
            installationOdometer: parseInt(formData.installationOdometer)
        };

        setSaving(true);
        setError("");
        try {
            await apiJson(`/api/vehicles/${vehicleId}/tires`, {
                method: "POST",
                body: dataToSend,
            });
            setShowForm(false);
            setFormData(createInitialFormData(latestOdometer));
            await loadTires();
        } catch (createError) {
            setError(createError.message || "No se pudo registrar el neumático");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (saving) return;
        const odo = window.prompt("Introduce el odómetro de baja:");
        if (odo === null) return;
        const odometer = Number(odo);
        const tire = tires.find((item) => item.id === id);
        if (!odo.trim() || !Number.isInteger(odometer) || odometer < 0 || odometer > 2147483647
            || odometer < (tire?.installationOdometer ?? 0)) {
            setError("Introduce un odómetro válido, igual o superior al de montaje");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await apiJson(`/api/vehicles/${vehicleId}/tires/${id}/deactivate?odometer=${odometer}`, { method: "PUT" });
            await loadTires();
        } catch (deactivateError) {
            setError(deactivateError.message || "Error al dar de baja");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-8 text-center text-sm text-slate-400">
                Cargando neumáticos...
            </div>
        );
    }

    const activeFront = tires.find((t) => t.active && t.axle === "FRONT");
    const activeRear = tires.find((t) => t.active && t.axle === "REAR");

    const renderAxleRow = (title, tire) => {
        if (!tire) {
            return (
                <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-slate-950/20 p-6 text-center text-slate-400">
                    No hay neumáticos activos en el eje {title.toLowerCase()}.
                </div>
            );
        }

        const km = tire.currentKm || 0;
        const replacePct = Math.min((km / 40000) * 100, 100);

        return (
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400">{title}</span>
                        <h4 className="mt-0.5 break-words text-lg font-semibold text-white">{tire.brand} {tire.model}</h4>
                        <p className="text-xs leading-5 text-slate-400">Medida: {tire.size} · Montados a {tire.installationOdometer.toLocaleString()} km</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleDeactivate(tire.id)}
                            disabled={saving}
                            className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition"
                            title="Dar de baja neumático"
                        >
                            <Ban className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="mb-2 flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                            Ciclo de Vida Útil {km >= 40000 && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 inline" />}
                        </span>
                        <span className={`whitespace-nowrap ${km >= 40000 ? "text-rose-400 font-medium" : "text-slate-300"}`}>{km.toLocaleString()} / 40.000 km</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${km >= 40000 ? "bg-rose-500" : "bg-indigo-500"}`}
                            style={{ width: `${replacePct}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/20 p-4">
                <div className="flex items-center gap-2">
                    <Disc className="h-5 w-5 text-teal-400" />
                    <span className="text-sm font-medium text-slate-300">Gestión de Neumáticos</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setFormData(createInitialFormData(latestOdometer));
                            setShowForm((current) => !current);
                        }}
                        className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition"
                        title="Montar nuevo neumático"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="glass-panel rounded-[2rem] p-5 sm:p-6 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2"><h3 className="text-base font-semibold text-white">Montar nuevo neumático</h3></div>

                    <label className="block">
                        <span className="text-xs text-slate-400 block mb-2">Marca</span>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none"
                            placeholder="Ej. Michelin"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-slate-400 block mb-2">Modelo</span>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none"
                            placeholder="Ej. Pilot Sport 5"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            required
                        />
                    </label>

                    <div className="md:col-span-2">
                        <span className="text-xs text-slate-400 block mb-2">Medida (Ancho / Perfil / Pulgada)</span>
                        <div className="flex gap-2 items-center">
                            <input
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none text-center"
                                placeholder="225"
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                required
                            />
                            <span className="text-slate-600 font-bold">/</span>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none text-center"
                                placeholder="45"
                                value={formData.profile}
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                                required
                            />
                            <span className="text-slate-600 font-bold">R</span>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none text-center"
                                placeholder="17"
                                value={formData.rim}
                                onChange={(e) => setFormData({ ...formData, rim: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-xs text-slate-400 block mb-2">Eje de colocación</span>
                        <CustomSelect
                            options={TIRE_AXLE_OPTIONS}
                            value={formData.axle}
                            onChange={(val) => setFormData({ ...formData, axle: val })}
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-slate-400 block mb-2">Fecha montaje</span>
                        <input
                            type="date"
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none"
                            value={formData.installationDate}
                            onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                            required
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-xs text-slate-400 block mb-2">Odómetro de montaje (km)</span>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none"
                            value={formData.installationOdometer}
                            onChange={(e) => setFormData({ ...formData, installationOdometer: e.target.value })}
                            required
                        />
                    </label>

                    <div className="grid gap-2 pt-2 sm:grid-cols-2 md:col-span-2 md:flex">
                        <button type="submit" disabled={saving} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-400 transition hover:text-white">Cancelar</button>
                    </div>
                </form>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {renderAxleRow("Eje Delantero", activeFront)}
                {renderAxleRow("Eje Trasero", activeRear)}
            </div>

            {tires.filter((t) => !t.active).length > 0 && (
                <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Historial de Desgaste</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 text-sm">
                        {tires.filter((t) => !t.active).map((tire) => (
                            <div key={tire.id} className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-200">{tire.brand} {tire.model} - {tire.size} ({tire.axle === "FRONT" ? "Delantero" : "Trasero"})</p>
                                    <p className="text-slate-500 mt-0.5">Instalación: {tire.installationOdometer.toLocaleString()} km → Baja: {tire.removalOdometer?.toLocaleString()} km</p>
                                </div>
                                <div className="shrink-0 text-left sm:text-right">
                                    <span className="block font-mono text-teal-400 bg-teal-400/5 px-2 py-1 rounded-md font-medium mb-1">
                                        +{tire.currentKm.toLocaleString()} km
                                    </span>
                                    {tire.expenseCost > 0 && (
                                        <span className="block text-amber-400 font-semibold">
                                            {tire.expenseCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
