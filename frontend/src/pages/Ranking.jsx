import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import { AlertTriangle, Loader2, Medal, Trophy, UserPlus, Users } from "lucide-react";

function medalColor(index) {
  if (index === 0) return "text-yellow-400";
  if (index === 1) return "text-slate-300";
  if (index === 2) return "text-amber-600";
  return "text-slate-500";
}

function RankingPosition({ entry, index, username, mobile = false }) {
  const isCurrentUser = entry.username === username;
  const isTop3 = index < 3;

  if (mobile) {
    return (
      <article className={`rounded-2xl border p-4 ${isCurrentUser ? "border-teal-300/20 bg-teal-400/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-label={`Posición ${index + 1}`} className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 font-bold ${medalColor(index)}`}>
              {isTop3 ? <Medal className="h-5 w-5" /> : `#${index + 1}`}
              {isTop3 ? <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] ring-1 ring-white/10">{index + 1}</span> : null}
            </span>
            <div className="min-w-0">
              <Link to={`/users/${entry.username}`} className="block truncate text-sm font-semibold text-white transition hover:text-teal-200">
                @{entry.username}{isCurrentUser ? " · Tú" : ""}
              </Link>
              <Link to={`/public/vehicles/${entry.vehicleId}`} className="mt-1 block truncate text-xs text-slate-400 transition hover:text-teal-200">
                {entry.brand} {entry.model}
              </Link>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-semibold text-teal-300">{entry.avgConsumption.toFixed(2)}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">L/100km</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <tr className={`transition hover:bg-white/[0.02] ${isCurrentUser ? "bg-teal-400/5" : ""}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${medalColor(index)}`}>#{index + 1}</span>
          {isTop3 ? <Medal className={`h-4 w-4 ${medalColor(index)}`} /> : null}
        </div>
      </td>
      <td className="px-6 py-4 font-medium text-white">
        <Link to={`/users/${entry.username}`} className="transition-colors hover:text-teal-300 hover:underline">
          {entry.username}
        </Link>
        {isCurrentUser ? <span className="ml-2 text-xs text-teal-400">(Tú)</span> : null}
      </td>
      <td className="px-6 py-4 text-slate-300">
        <Link to={`/public/vehicles/${entry.vehicleId}`} className="transition-colors hover:text-teal-300 hover:underline">
          {entry.brand} {entry.model}
        </Link>
      </td>
      <td className="px-6 py-4 text-right font-mono font-medium text-teal-300">
        {entry.avgConsumption.toFixed(2)} L/100km
      </td>
    </tr>
  );
}

export default function Ranking() {
  const { username } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "friends" ? "friends" : "global";
  const [rankings, setRankings] = useState({ global: [], friends: [] });
  const [userVehicles, setUserVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [errors, setErrors] = useState({ global: "", friends: "", vehicles: "" });
  const [retryVersion, setRetryVersion] = useState(0);
  const error = errors[activeTab];

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const [rankingResult, vehiclesResult] = await Promise.allSettled([
        apiJson("/api/ranking"),
        apiJson("/api/vehicles"),
      ]);
      if (!active) return;
      if (rankingResult.status === "fulfilled") {
        setRankings((current) => ({ ...current, global: rankingResult.value }));
      }
      if (vehiclesResult.status === "fulfilled") setUserVehicles(vehiclesResult.value || []);
      setErrors((current) => ({
        ...current,
        global: rankingResult.status === "rejected" ? rankingResult.reason.message || "No se pudo cargar la clasificación" : "",
        vehicles: vehiclesResult.status === "rejected" ? "No se pudo comprobar la visibilidad de tus vehículos." : "",
      }));
      setLoading(false);
    };

    fetchData();
    return () => { active = false; };
  }, [retryVersion]);

  useEffect(() => {
    if (activeTab !== "friends") return;
    let active = true;
    const loadFriendsRanking = async () => {
      setFriendsLoading(true);
      setErrors((current) => ({ ...current, friends: "" }));
      try {
        const data = await apiJson("/api/rankings/friends");
        if (active) {
          setRankings((current) => ({ ...current, friends: data }));
          setFriendsLoaded(true);
        }
      } catch (loadError) {
        if (active) setErrors((current) => ({ ...current, friends: loadError.message || "No se pudo cargar el ranking de amigos" }));
      } finally {
        if (active) setFriendsLoading(false);
      }
    };
    loadFriendsRanking();
    return () => { active = false; };
  }, [activeTab, retryVersion]);

  const ranking = rankings[activeTab];
  const top3 = ranking.slice(0, 3);
  const myTop3EntryIndex = top3.findIndex((entry) => entry.username === username);
  const hasHiddenVehicles = userVehicles.some((vehicle) => !vehicle.isPublic || !vehicle.showFuelData);
  const hasEligibleVehicle = userVehicles.some((vehicle) => vehicle.isPublic && vehicle.showFuelData);
  const rankingLabel = activeTab === "global" ? "global" : "entre tus amigos";
  const emptyMessage = useMemo(() => {
    if (activeTab === "friends") {
      return "Todavía no hay vehículos suficientes entre tus amigos para crear la clasificación.";
    }
    return "Aún no hay suficientes datos para generar el ranking.";
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 text-slate-100">
        <div className="section-shell flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
          Cargando clasificación...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-20 lg:pb-16">
        <div className="section-shell space-y-6">
          <header className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-400/10">
                <Trophy className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Comunidad</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Clasificación</h1>
                <p className="mt-1 text-sm text-slate-400">Compara los vehículos más eficientes en L/100km.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-slate-950/60 p-1 sm:max-w-md">
              <button
                type="button"
                aria-pressed={activeTab === "global"}
                onClick={() => setSearchParams({})}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === "global" ? "bg-teal-300 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <Trophy className="h-4 w-4" /> Global
              </button>
              <button
                type="button"
                aria-pressed={activeTab === "friends"}
                onClick={() => setSearchParams({ tab: "friends" })}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === "friends" ? "bg-teal-300 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                {activeTab === "friends" && friendsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Mis amigos
              </button>
            </div>
          </header>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
              <button type="button" onClick={() => setRetryVersion((current) => current + 1)} className="ml-3 min-h-10 font-semibold underline underline-offset-4">Reintentar</button>
            </div>
          ) : null}

          {errors.vehicles ? <p role="status" className="text-sm text-amber-200">{errors.vehicles}</p> : null}

          {!error && !(activeTab === "friends" && friendsLoading) && myTop3EntryIndex !== -1 ? (
            <div className={`rounded-2xl border bg-gradient-to-r to-transparent p-5 ${
              myTop3EntryIndex === 0 ? "border-yellow-400/30 from-yellow-400/20" :
              myTop3EntryIndex === 1 ? "border-slate-300/30 from-slate-300/20" :
              "border-amber-600/30 from-amber-600/20"
            }`}>
              <h2 className={`flex items-center gap-2 text-lg font-bold ${medalColor(myTop3EntryIndex)}`}>
                <Medal className="h-5 w-5" />
                ¡Estás en el TOP {myTop3EntryIndex + 1} {rankingLabel}!
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Tu {top3[myTop3EntryIndex].brand} {top3[myTop3EntryIndex].model} está entre los vehículos más eficientes.
              </p>
            </div>
          ) : null}

          {hasHiddenVehicles && !hasEligibleVehicle ? (
            <div className="flex gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
              <div>
                <h3 className="font-semibold text-amber-400">Visibilidad desactivada</h3>
                <p className="mt-1 text-sm text-amber-100/80">
                  Para aparecer en las clasificaciones, debes permitir mostrar los datos de combustible en tus ajustes.
                </p>
                <Link to="/settings" className="mt-3 inline-block text-sm font-medium text-white transition hover:text-amber-200">
                  Ir a Ajustes →
                </Link>
              </div>
            </div>
          ) : null}

          {error ? null : activeTab === "friends" && friendsLoaded && !friendsLoading && ranking.length === 0 ? (
            <section className="glass-panel flex flex-col items-center rounded-[2rem] px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">Crea tu ranking privado</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{emptyMessage}</p>
              <Link to="/friends" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                Gestionar amigos
              </Link>
            </section>
          ) : activeTab === "friends" && friendsLoading ? (
            <section className="glass-panel flex min-h-48 items-center justify-center rounded-[2rem] text-sm text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-300" />
              Cargando ranking de amigos...
            </section>
          ) : (
            <section className="glass-panel overflow-hidden rounded-[2rem]">
              <div className="space-y-3 p-4 sm:hidden">
                {ranking.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">{emptyMessage}</p>
                ) : ranking.map((entry, index) => (
                  <RankingPosition key={entry.vehicleId} entry={entry} index={index} username={username} mobile />
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Posición</th>
                      <th className="px-6 py-4 font-medium">Usuario</th>
                      <th className="px-6 py-4 font-medium">Vehículo</th>
                      <th className="px-6 py-4 text-right font-medium">Consumo medio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ranking.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-400">{emptyMessage}</td>
                      </tr>
                    ) : ranking.map((entry, index) => (
                      <RankingPosition key={entry.vehicleId} entry={entry} index={index} username={username} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
