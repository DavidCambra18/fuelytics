import { useEffect, useState } from "react";
import { Fuel, Receipt, Leaf, Wrench, Award, Calendar } from "lucide-react";
import { apiFetch } from "../services/api";

const BADGE_ICONS = {
    fuel: Fuel,
    receipt: Receipt,
    leaf: Leaf,
    wrench: Wrench,
    default: Award,
};

function formatDateEs(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export default function BadgesModule() {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const res = await apiFetch("/api/badges");
                if (res.ok) {
                    const data = await res.json();
                    setBadges(data || []);
                } else {
                    setError("No se pudieron cargar las insignias");
                }
            } catch (err) {
                setError("Error al conectar con el servidor");
            } finally {
                setLoading(false);
            }
        };
        loadBadges();
    }, []);

    if (loading) {
        return <div className="py-8 text-center text-sm text-slate-400">Cargando logros...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {error}
                </div>
            )}

            <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
                <div className="space-y-2 mb-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold">Garaje y Perfil</p>
                    <h3 className="text-2xl font-bold text-white">Insignias y Logros</h3>
                    <p className="text-sm leading-6 text-slate-300 max-w-2xl">
                        Tu colección de hitos desbloqueados por mantener una conducción eficiente y tu vehículo al día.
                    </p>
                </div>

                {badges.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-slate-950/20 p-8 text-center text-slate-400 text-sm">
                        Aún no has desbloqueado ninguna insignia. ¡Sigue registrando datos para conseguir la primera!
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {badges.map((badge, index) => {
                            const IconComponent = BADGE_ICONS[badge.iconName] || BADGE_ICONS.default;

                            return (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 flex flex-col items-center text-center transition hover:border-teal-500/30"
                                >
                                    <div className="p-3.5 rounded-full bg-teal-500/10 text-teal-400 mb-3 border border-teal-500/10 shadow-inner">
                                        <IconComponent className="h-6 w-6" />
                                    </div>

                                    <h4 className="text-sm font-bold text-white tracking-wide">{badge.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed flex-grow">{badge.description}</p>

                                    <div className="mt-4 pt-3 w-full border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
                                        <Calendar className="h-3 w-3" />
                                        <span>Obtenido: {formatDateEs(badge.earnedDate)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}