import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Ban, Plus, Disc, AlertTriangle } from "lucide-react";
import { apiFetch } from "../services/api";
import { TIRE_AXLE_OPTIONS } from "../utils/vehicleLabels";
import CustomSelect from "./CustomSelect";

export default function TiresModule() {
    const { selectedVehicle } = useOutletContext();
    const vehicleId = selectedVehicle?.id;
    const latestOdometer = selectedVehicle?.odometer;

    const [tires, setTires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        brand: "",
        model: "",
        size: "",
        width: "",
        profile: "",
        rim: "",
        axle: "FRONT",
        installationDate: new Date().toISOString().split("T")[0],
        installationOdometer: latestOdometer || "",
    });

    useEffect(() => {
        if (latestOdometer) {
            setFormData((prev) => ({ ...prev, installationOdometer: latestOdometer }));
        }
    }, [latestOdometer]);

    const loadTires = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/vehicles/${vehicleId}/tires`);
            if (res.ok) {
                const data = await res.json();
                setTires(data || []);
            }
        } catch (err) {
            setError("Error cargando neumáticos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vehicleId) loadTires();
    }, [vehicleId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        const fullSize = `${formData.width}/${formData.profile} R${formData.rim}`;

        const dataToSend = {
            brand: formData.brand,
            model: formData.model,
            size: fullSize,
            axle: formData.axle,
            installationDate: formData.installationDate,
            installationOdometer: parseInt(formData.installationOdometer)
        };

        try {
            const res = await apiFetch(`/api/vehicles/${vehicleId}/tires`, {
                method: "POST",
                body: dataToSend,
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({
                    brand: "",
                    model: "",
                    size: "",
                    axle: "FRONT",
                    installationDate: new Date().toISOString().split("T")[0],
                    installationOdometer: latestOdometer || "",
                });
                loadTires();
            }
        } catch (err) {
            setError("No se pudo registrar el neumático");
        }
    };

    const handleRotate = async () => {
        const odo = window.prompt("Introduce el odómetro actual de rotación:");
        if (!odo) return;
        try {
            const res = await apiFetch(`/api/vehicles/${vehicleId}/tires/rotate?odometer=${odo}`, { method: "POST" });
            if (res.ok) loadTires();
        } catch (err) {
            setError("Error al rotar neumáticos");
        }
    };

    const handleDeactivate = async (id) => {
        const odo = window.prompt("Introduce el odómetro de baja:");
        if (!odo) return;
        try {
            const res = await apiFetch(`/api/vehicles/${vehicleId}/tires/${id}/deactivate?odometer=${odo}`, { method: "PUT" });
            if (res.ok) loadTires();
        } catch (err) {
            setError("Error al dar de baja");
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
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400">{title}</span>
                        <h4 className="text-lg font-semibold text-white mt-0.5">{tire.brand} {tire.model}</h4>
                        <p className="text-xs text-slate-400">Medida: {tire.size} | Montados a {tire.installationOdometer.toLocaleString()} km</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleDeactivate(tire.id)}
                            className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition"
                            title="Dar de baja neumático"
                        >
                            <Ban className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                            Ciclo de Vida Útil {km >= 40000 && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 inline" />}
                        </span>
                        <span className={km >= 40000 ? "text-rose-400 font-medium" : "text-slate-300"}>{km.toLocaleString()} / 40.000 km</span>
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
            {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

            <div className="flex justify-between items-center bg-slate-950/20 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                    <Disc className="h-5 w-5 text-teal-400" />
                    <span className="text-sm font-medium text-slate-300">Gestión de Neumáticos</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowForm(!showForm)}
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
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white text-sm outline-none"
                            value={formData.installationOdometer}
                            onChange={(e) => setFormData({ ...formData, installationOdometer: e.target.value })}
                            required
                        />
                    </label>

                    <div className="md:col-span-2 flex gap-2 pt-2">
                        <button type="submit" className="px-5 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-semibold hover:bg-slate-200 transition">Guardar</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-white/10 text-slate-400 rounded-xl text-xs font-semibold hover:text-white transition">Cancelar</button>
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
                            <div key={tire.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                                <div>
                                    <p className="font-semibold text-slate-200">{tire.brand} {tire.model} - {tire.size} ({tire.axle === "FRONT" ? "Delantero" : "Trasero"})</p>
                                    <p className="text-slate-500 mt-0.5">Instalación: {tire.installationOdometer.toLocaleString()} km → Baja: {tire.removalOdometer?.toLocaleString()} km</p>
                                </div>
                                <div className="text-right">
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