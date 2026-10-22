import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import { AlertTriangle, Loader2, Medal, Trophy, UserPlus, Users } from "lucide-react";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";

function medalColor(index) {
  if (index === 0) return "text-yellow-400";
  if (index === 1) return "text-slate-300";
  if (index === 2) return "text-amber-300";
  return "text-muted-foreground";
}

function RankingPosition({ entry, index, username }) {
  const isCurrentUser = entry.username === username;
  const isTop3 = index < 3;

  return (
    <tr data-current-user={isCurrentUser}>
      <td className="fl-ranking-position">
        <span aria-label={`Posición ${index + 1}`} className={medalColor(index)}>
          <span aria-hidden="true">#{index + 1}</span>
          {isTop3 ? <Medal aria-hidden="true" className="h-4 w-4" /> : null}
        </span>
      </td>
      <td className="fl-ranking-user">
        <Link to={`/users/${entry.username}`} className="fl-community-link">{entry.username}</Link>
        {isCurrentUser ? <span className="fl-ranking-you">Tú</span> : null}
      </td>
      <td className="fl-ranking-vehicle">
        <Link to={`/public/vehicles/${entry.vehicleId}`} className="fl-community-link">{entry.brand} {entry.model}</Link>
      </td>
      <td className="fl-ranking-consumption">
        {entry.avgConsumption.toFixed(2)} <span>L/100km</span>
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
      <div className="fl-community-page section-shell pb-10">
        <Surface as="section" className="fl-workspace fl-community-state" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          Cargando clasificación...
        </Surface>
      </div>
    );
  }

  return (
    <main className="fl-community-page pb-10 text-foreground lg:pb-16">
      <div className="section-shell space-y-6">
        <Surface as="header" className="fl-workspace">
          <h1 className="fl-page-title">Clasificación</h1>
          <p className="fl-supporting mt-3">Compara los vehículos más eficientes en L/100km.</p>
          <div className="fl-community-switch mt-6" role="group" aria-label="Ámbito de la clasificación">
            <Button type="button" variant={activeTab === "global" ? "secondary" : "ghost"}
              className={activeTab === "global" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}
              aria-pressed={activeTab === "global"} onClick={() => setSearchParams({})}>
              <Trophy aria-hidden="true" />Global
            </Button>
            <Button type="button" variant={activeTab === "friends" ? "secondary" : "ghost"}
              className={activeTab === "friends" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}
              aria-pressed={activeTab === "friends"} onClick={() => setSearchParams({ tab: "friends" })}>
              {activeTab === "friends" && friendsLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Users aria-hidden="true" />}
              Mis amigos
            </Button>
          </div>
        </Surface>

        {error ? (
          <div role="alert" className="fl-community-error">
            <span>{error}</span>
            <Button type="button" variant="outline" onClick={() => setRetryVersion((current) => current + 1)}>Reintentar</Button>
          </div>
        ) : null}
        {errors.vehicles ? <p role="status" className="text-sm text-amber-200">{errors.vehicles}</p> : null}

        {!error && !(activeTab === "friends" && friendsLoading) && myTop3EntryIndex !== -1 ? (
          <Surface variant="inset" className="fl-ranking-achievement">
            <Medal className={`h-6 w-6 shrink-0 ${medalColor(myTop3EntryIndex)}`} aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">¡Estás en el TOP {myTop3EntryIndex + 1} {rankingLabel}!</h2>
              <p className="fl-supporting mt-1">Tu {top3[myTop3EntryIndex].brand} {top3[myTop3EntryIndex].model} está entre los vehículos más eficientes.</p>
            </div>
          </Surface>
        ) : null}

        {hasHiddenVehicles && !hasEligibleVehicle ? (
          <div className="flex gap-4 rounded-[var(--radius-card)] border border-amber-300/30 bg-amber-400/10 p-5">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-semibold text-amber-200">Visibilidad desactivada</h2>
              <p className="mt-2 text-sm leading-6 text-amber-100">Para aparecer en las clasificaciones, debes permitir mostrar los datos de combustible en tus ajustes.</p>
              <Button asChild variant="outline" className="mt-3"><Link to="/settings">Ir a Ajustes</Link></Button>
            </div>
          </div>
        ) : null}

        {error ? null : activeTab === "friends" && friendsLoaded && !friendsLoading && ranking.length === 0 ? (
          <Surface as="section" className="fl-workspace fl-community-empty">
            <UserPlus className="h-7 w-7 text-primary" aria-hidden="true" />
            <h2 className="fl-section-title mt-4">Crea tu ranking privado</h2>
            <p className="fl-supporting mt-3 max-w-md">{emptyMessage}</p>
            <Button asChild className="mt-5"><Link to="/friends">Gestionar amigos</Link></Button>
          </Surface>
        ) : activeTab === "friends" && friendsLoading ? (
          <Surface as="section" className="fl-workspace fl-community-state" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />Cargando ranking de amigos...
          </Surface>
        ) : (
          <Surface as="section" className="fl-workspace fl-ranking-results" aria-label="Posiciones de la clasificación">
            <table className="fl-ranking-table">
              <caption className="sr-only">Clasificación {rankingLabel} por consumo medio</caption>
              <thead><tr>
                <th scope="col">Posición</th><th scope="col">Usuario</th><th scope="col">Vehículo</th><th scope="col">Consumo medio</th>
              </tr></thead>
              <tbody>
                {ranking.length === 0 ? <tr><td colSpan="4" className="fl-ranking-empty">{emptyMessage}</td></tr> : ranking.map((entry, index) => (
                  <RankingPosition key={entry.vehicleId} entry={entry} index={index} username={username} />
                ))}
              </tbody>
            </table>
          </Surface>
        )}
      </div>
    </main>
  );
}
