import { localDate } from "../utils/localDate";
import useActionGuard from "../hooks/useActionGuard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Ban, Plus, Disc, AlertTriangle } from "lucide-react";
import { apiJson } from "../services/api";
import { TIRE_AXLE_OPTIONS, getOdometerUnit } from "../utils/vehicleLabels";
import { Surface } from "./ui/surface";
import { Input } from "./ui/field";
import { Button } from "./ui/button";
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
        installationDate: localDate(),
        installationOdometer: odometer ?? "",
    };
}

export default function TiresModule() {
    const { guard, isActive } = useActionGuard();
    const { selectedVehicle, vehicleRefreshing, vehicleRefreshError } = useOutletContext();
    const vehicleId = selectedVehicle?.id;
    const latestOdometer = selectedVehicle?.odometer;
    const odometerUnit = getOdometerUnit(selectedVehicle?.vehicleType);
    const usesHours = odometerUnit === "h";

    const [tires, setTires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [loadFailed, setLoadFailed] = useState(false);
    const retryFocus = useRef(false);
    const retryButtonRef = useRef(null);
    const headingRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState(() => createInitialFormData(latestOdometer));

    useEffect(() => {
        if (loading || !retryFocus.current) return;
        retryFocus.current = false;
        (loadFailed ? retryButtonRef : headingRef).current?.focus({ preventScroll: true });
    }, [loading, loadFailed]);

    const loadTires = useCallback(async (signal) => {
        setLoading(true);
        setError("");
        setLoadFailed(false);
        try {
            const data = await apiJson(`/api/vehicles/${vehicleId}/tires`, { signal });
            if (!signal?.aborted && isActive()) setTires(data || []);
        } catch (loadError) {
            if (!signal?.aborted && isActive()) {
                setLoadFailed(true);
                setError(loadError.message || "Error cargando neumáticos");
            }
        } finally {
            if (!signal?.aborted && isActive()) setLoading(false);
        }
    }, [vehicleId, isActive]);

    useEffect(() => {
        if (!vehicleId) return undefined;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => loadTires(controller.signal), 0);
        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [loadTires, vehicleId]);

    const handleCreate = guard(async (e) => {
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
            if (!isActive()) return;
            setShowForm(false);
            setFormData(createInitialFormData(latestOdometer));
            await loadTires();
        } catch (createError) {
            if (!isActive()) return;
            setError(createError.message || "No se pudo registrar el neumático");
        } finally {
            setSaving(false);
        }
    });

    const handleDeactivate = guard(async (id) => {
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
            if (!isActive()) return;
            await loadTires();
        } catch (deactivateError) {
            if (!isActive()) return;
            setError(deactivateError.message || "Error al dar de baja");
        } finally {
            setSaving(false);
        }
    });

    if (loading) {
        return (
            <div role="status" className="py-8 text-center text-sm text-slate-400">
                Cargando neumáticos...
            </div>
        );
    }

    const activeFront = tires.find((t) => t.active && t.axle === "FRONT");
    const activeRear = tires.find((t) => t.active && t.axle === "REAR");

    const renderAxleRow = (title, tire) => {
        if (!tire) {
            return (
                <div className="fl-surface fl-empty-vehicle fl-supporting">
                    <h3 className="text-base font-medium text-foreground">{title}</h3>
                    <p>No hay neumáticos activos en este eje.</p>
                </div>
            );
        }

        const km = tire.currentKm || 0;
        const replacePct = Math.min((km / 40000) * 100, 100);

        return (
            <div className="fl-surface fl-tire-card space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400">{title}</span>
                        <h3 className="mt-0.5 break-words text-lg font-semibold text-foreground">{tire.brand} {tire.model}</h3>
                        <p className="fl-supporting mt-2">Medida: {tire.size} · Montados a {tire.installationOdometer.toLocaleString()} {odometerUnit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => handleDeactivate(tire.id)}
                            disabled={saving} aria-busy={saving}
                            variant="destructive" size="icon" aria-label={`Dar de baja neumático ${title.toLowerCase()}`}
                            title="Dar de baja neumático"
                        >
                            <Ban className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {usesHours ? <p className="fl-supporting">Uso acumulado: {km.toLocaleString("es-ES")} h. Revisa el desgaste según las indicaciones del fabricante.</p> : <div className="pt-2">
                    <div className="mb-3 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                            Ciclo de Vida Útil {km >= 40000 && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 inline" />}
                        </span>
                        <span className={`whitespace-nowrap ${km >= 40000 ? "text-rose-400 font-medium" : "text-slate-300"}`}>{km.toLocaleString()} / 40.000 km</span>
                    </div>
                    <div role="progressbar" aria-label={`Ciclo de vida útil ${title.toLowerCase()}`} aria-valuemin={0} aria-valuemax={40000} aria-valuenow={Math.min(km, 40000)} aria-valuetext={`${km.toLocaleString()} de 40.000 km`} className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${km >= 40000 ? "bg-rose-500" : "bg-primary"}`}
                            style={{ width: `${replacePct}%` }}
                        />
                    </div>
                </div>}
            </div>
        );
    };

    if (loadFailed) return (
        <Surface as="section" className="fl-workspace">
            <h2 className="fl-section-title">Neumáticos</h2>
            <p role="alert" className="fl-feedback-error mt-4">{error}</p>
            <Button ref={retryButtonRef} type="button" variant="outline" className="mt-4" onClick={() => { retryFocus.current = true; loadTires(); }}>Reintentar</Button>
        </Surface>
    );

    return (
        <div className="space-y-6">
            {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

            <Surface as="header" className="fl-workspace-heading fl-workspace">
                <div className="flex items-center gap-2">
                    <Disc className="h-5 w-5 text-teal-400" />
                    <h2 ref={headingRef} tabIndex={-1} className="fl-section-title focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]">Neumáticos</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        disabled={saving || vehicleRefreshing || !!vehicleRefreshError}
                        pending={vehicleRefreshing} pendingLabel="Actualizando..."
                        onClick={() => {
                            setFormData(createInitialFormData(latestOdometer));
                            setShowForm((current) => !current);
                        }}
                        aria-label="Montar neumáticos" aria-expanded={showForm} aria-controls={showForm ? "tire-installation-form" : undefined}
                        title="Montar nuevo neumático"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Montar neumáticos</span>
                    </Button>
                </div>
            </Surface>

            {showForm && (
                <form aria-busy={saving} onSubmit={handleCreate} id="tire-installation-form" className="fl-surface fl-workspace grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2"><h3 className="text-base font-semibold text-white">Montar nuevo neumático</h3></div>

                    <label className="block">
                        <span className="fl-label block mb-2">Marca</span>
                        <Input
                            placeholder="Ej. Michelin"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="fl-label block mb-2">Modelo</span>
                        <Input
                            placeholder="Ej. Pilot Sport 5"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            required
                        />
                    </label>

                    <div className="md:col-span-2">
                        <span className="fl-label block mb-2">Medida (Ancho / Perfil / Pulgada)</span>
                        <div className="flex gap-2 items-center">
                            <Input
                                aria-label="Ancho del neumático (mm)"
                                placeholder="225"
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                required
                            />
                            <span className="text-muted-foreground font-medium">/</span>
                            <Input
                                aria-label="Perfil del neumático (%)"
                                placeholder="45"
                                value={formData.profile}
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                                required
                            />
                            <span className="text-muted-foreground font-medium">R</span>
                            <Input
                                aria-label="Diámetro de la llanta (pulgadas)"
                                placeholder="17"
                                value={formData.rim}
                                onChange={(e) => setFormData({ ...formData, rim: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <label className="block">
                        <span className="fl-label block mb-2">Eje de colocación</span>
                        <CustomSelect appearance="atlantic"
                            options={TIRE_AXLE_OPTIONS}
                            value={formData.axle}
                            onChange={(val) => setFormData({ ...formData, axle: val })}
                        />
                    </label>
                    <label className="block">
                        <span className="fl-label block mb-2">Fecha montaje</span>
                        <Input
                            type="date"

                            value={formData.installationDate}
                            onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                            required
                        />
                    </label>
                    <label className="block md:col-span-2">
                        <span className="fl-label block mb-2">Odómetro de montaje ({odometerUnit})</span>
                        <Input
                            type="number"
                            min="0"
                            step="1"

                            value={formData.installationOdometer}
                            onChange={(e) => setFormData({ ...formData, installationOdometer: e.target.value })}
                            required
                        />
                    </label>

                    <div className="grid gap-2 pt-2 sm:grid-cols-2 md:col-span-2 md:flex">
                        <Button type="submit" pending={saving} pendingLabel="Guardando...">Guardar</Button>
                        <Button type="button" onClick={() => setShowForm(false)} variant="outline">Cancelar</Button>
                    </div>
                </form>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {renderAxleRow("Eje Delantero", activeFront)}
                {renderAxleRow("Eje Trasero", activeRear)}
            </div>

            {tires.filter((t) => !t.active).length > 0 && (
                <div className="fl-surface fl-workspace">
                    <h3 className="fl-section-title mb-5">Historial de desgaste</h3>
                    <div className="fl-tire-history max-h-80 overflow-y-auto text-sm">
                        {tires.filter((t) => !t.active).map((tire) => (
                            <div key={tire.id} className="fl-tire-history-row">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-200">{tire.brand} {tire.model} - {tire.size} ({tire.axle === "FRONT" ? "Delantero" : "Trasero"})</p>
                                    <p className="text-muted-foreground mt-1">Instalación: {tire.installationOdometer.toLocaleString()} {odometerUnit} → Baja: {tire.removalOdometer?.toLocaleString()} {odometerUnit}</p>
                                </div>
                                <div className="shrink-0 text-left sm:text-right">
                                    <span className="block tabular-nums text-primary font-medium mb-1">
                                        +{tire.currentKm.toLocaleString()} {odometerUnit}
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
