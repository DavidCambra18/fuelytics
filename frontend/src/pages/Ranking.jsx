import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiJson } from "../services/api";
import { Trophy, Medal, AlertTriangle } from "lucide-react";

export default function Ranking() {
  const { username } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [userVehicles, setUserVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankingData, vehiclesData] = await Promise.all([
          apiJson("/api/ranking"),
          apiJson("/api/vehicles")
        ]);
        
        setRanking(rankingData);
        setUserVehicles(vehiclesData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const top3 = ranking.slice(0, 3);
  const myTop3EntryIndex = top3.findIndex((r) => r.username === username);
  
  const hasHiddenVehicles = userVehicles.some((v) => !v.isPublic || !v.showFuelData);
  const hasEligibleVehicle = userVehicles.some((v) => v.isPublic && v.showFuelData);

  const getMedalColor = (index) => {
    if (index === 0) return "text-yellow-400";
    if (index === 1) return "text-slate-300";
    if (index === 2) return "text-amber-600";
    return "text-transparent";
  };

  if (loading) {
    return (
      <div className="min-h-screen text-slate-100 pt-20">
        <div className="section-shell">Cargando clasificación...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-20 lg:pb-16">
        <div className="section-shell space-y-6">
          
          <header className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-400/10">
                <Trophy className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Ranking Global</h1>
                <p className="mt-1 text-sm text-slate-400">Los vehículos más eficientes de la comunidad (L/100km).</p>
              </div>
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          {myTop3EntryIndex !== -1 && (
            <div className={`rounded-2xl border bg-gradient-to-r to-transparent p-5 ${
              myTop3EntryIndex === 0 ? "border-yellow-400/30 from-yellow-400/20" :
              myTop3EntryIndex === 1 ? "border-slate-300/30 from-slate-300/20" :
              "border-amber-600/30 from-amber-600/20"
            }`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${
                myTop3EntryIndex === 0 ? "text-yellow-400" :
                myTop3EntryIndex === 1 ? "text-slate-300" :
                "text-amber-500"
              }`}>
                <Medal className="h-5 w-5" />
                ¡Enhorabuena! Estás en el TOP {myTop3EntryIndex + 1} global.
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Tu {top3[myTop3EntryIndex].brand} {top3[myTop3EntryIndex].model} es uno de los más eficientes de toda la comunidad.
              </p>
            </div>
          )}

          {hasHiddenVehicles && !hasEligibleVehicle && (
            <div className="flex gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-400">Visibilidad desactivada</h3>
                <p className="mt-1 text-sm text-amber-100/80">
                  Para aparecer en el ranking de eficiencia, debes permitir mostrar los datos de combustible en tus ajustes.
                </p>
                <Link to="/settings" className="mt-3 inline-block text-sm font-medium text-white hover:text-amber-200 transition">
                  Ir a Ajustes →
                </Link>
              </div>
            </div>
          )}

          <section className="glass-panel rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Posición</th>
                    <th className="px-6 py-4 font-medium">Usuario</th>
                    <th className="px-6 py-4 font-medium">Vehículo</th>
                    <th className="px-6 py-4 font-medium text-right">Consumo Medio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                        Aún no hay suficientes datos para generar el ranking.
                      </td>
                    </tr>
                  ) : (
                    ranking.map((entry, index) => {
                      const isCurrentUser = entry.username === username;
                      const isTop3 = index < 3;

                      return (
                        <tr 
                          key={entry.vehicleId}
                          className={`transition hover:bg-white/[0.02] ${isCurrentUser ? "bg-teal-400/5" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isTop3 ? getMedalColor(index) : "text-slate-500"}`}>
                                #{index + 1}
                              </span>
                              {isTop3 && <Medal className={`h-4 w-4 ${getMedalColor(index)}`} />}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-white">
                            <Link 
                              to={`/users/${entry.username}`} 
                              className="transition-colors hover:text-teal-300 hover:underline"
                            >
                              {entry.username}
                            </Link>
                            {isCurrentUser && <span className="ml-2 text-xs text-teal-400">(Tú)</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <Link 
                              to={`/public/vehicles/${entry.vehicleId}`} 
                              className="transition-colors hover:text-teal-300 hover:underline"
                            >
                              {entry.brand} {entry.model}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-teal-300">
                            {entry.avgConsumption.toFixed(2)} L/100km
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}