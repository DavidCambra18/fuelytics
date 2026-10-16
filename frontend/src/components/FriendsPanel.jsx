import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiFetch, apiJson } from "../services/api";

const EMPTY_OVERVIEW = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
};

function displayName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

function UserIdentity({ user }) {
  const name = displayName(user);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-sm font-bold text-teal-200 ring-1 ring-teal-300/15">
        {user.username.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <Link
          to={`/users/${user.username}`}
          className="block truncate text-sm font-semibold text-white transition hover:text-teal-200"
        >
          @{user.username}
        </Link>
        {name ? <p className="mt-0.5 truncate text-xs text-slate-400">{name}</p> : null}
      </div>
    </div>
  );
}

export default function FriendsPanel({ onNotify }) {
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [overviewLoaded, setOverviewLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeAction, setActiveAction] = useState("");
  const [confirmingRemovalId, setConfirmingRemovalId] = useState(null);
  const searchVersion = useRef(0);
  const actionInProgress = useRef(false);

  const loadOverview = async () => {
    const data = await apiJson("/api/friendships");
    setOverview({ ...EMPTY_OVERVIEW, ...data });
    setOverviewLoaded(true);
  };

  useEffect(() => {
    let active = true;

    apiJson("/api/friendships")
      .then((data) => {
        if (active) {
          setOverview({ ...EMPTY_OVERVIEW, ...data });
          setOverviewLoaded(true);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "No se pudieron cargar tus amistades");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      searchVersion.current += 1;
    };
  }, []);

  const refreshSearch = async () => {
    if (actionInProgress.current) return;
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setError("Escribe al menos 2 caracteres para buscar usuarios");
      return;
    }

    setSearching(true);
    setResults([]);
    setSearched(false);
    const version = ++searchVersion.current;
    setError("");
    try {
      const data = await apiJson(`/api/friendships/search?username=${encodeURIComponent(normalizedQuery)}`);
      if (version === searchVersion.current) {
        setResults(data);
        setSearched(true);
      }
    } catch (searchError) {
      if (version === searchVersion.current) setError(searchError.message || "No se pudo completar la búsqueda");
    } finally {
      if (version === searchVersion.current) setSearching(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    refreshSearch();
  };

  const synchronizeRelationships = async (version) => {
    await loadOverview();
    if (searched && query.trim().length >= 2 && version === searchVersion.current) {
      const data = await apiJson(`/api/friendships/search?username=${encodeURIComponent(query.trim())}`);
      if (version === searchVersion.current) setResults(data);
    }
  };

  const refreshRelationships = async () => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setActiveAction("refresh");
    setError("");
    try {
      await synchronizeRelationships(searchVersion.current);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron actualizar tus amistades");
    } finally {
      actionInProgress.current = false;
      setActiveAction("");
    }
  };

  const runAction = async (key, action, successMessage) => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    const version = searchVersion.current;
    setActiveAction(key);
    setError("");
    try {
      await action();
      onNotify(successMessage);
      try {
        await synchronizeRelationships(version);
      } catch {
        setError("La acción se ha completado, pero no se pudo actualizar la lista. Recarga la página para ver los cambios.");
      }
    } catch (actionError) {
      const message = actionError.message || "No se pudo completar la acción";
      setError(message);
      onNotify(message, "error");
      // A request may have been answered or cancelled from another session.
      try {
        await synchronizeRelationships(version);
      } catch {
        // Keep the original error; the refresh button lets the user try again.
      }
    } finally {
      actionInProgress.current = false;
      setActiveAction("");
    }
  };

  const sendRequest = (user) => runAction(
    `send-${user.username}`,
    () => apiJson("/api/friendships/requests", {
      method: "POST",
      body: { username: user.username },
    }),
    `Solicitud enviada a @${user.username}`
  );

  const updateRequest = (friendship, decision) => runAction(
    `${decision}-${friendship.friendshipId}`,
    () => apiJson(`/api/friendships/${friendship.friendshipId}/${decision}`, { method: "PUT" }),
    decision === "accept"
      ? `Ahora tú y @${friendship.username} sois amigos`
      : `Solicitud de @${friendship.username} rechazada`
  );

  const removeRelationship = (friendship, message) => runAction(
    `remove-${friendship.friendshipId}`,
    async () => {
      const response = await apiFetch(`/api/friendships/${friendship.friendshipId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "No se pudo eliminar la amistad");
      }
    },
    message
  );

  const isBusy = (key) => activeAction === key;

  if (loading) {
    return (
      <section className="flex min-h-56 items-center justify-center rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6 text-sm text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-300" />
        Cargando amistades...
      </section>
    );
  }

  if (!overviewLoaded) {
    return (
      <section role="alert" className="rounded-3xl border border-rose-400/20 bg-slate-950/45 p-6 text-sm text-rose-100">
        <p>{error || "No se pudieron cargar tus amistades"}</p>
        <button type="button" className="mt-4 min-h-11 rounded-xl bg-white/10 px-4 font-semibold transition hover:bg-white/15" onClick={async () => {
          setLoading(true);
          setError("");
          try {
            await loadOverview();
          } catch (loadError) {
            setError(loadError.message || "No se pudieron cargar tus amistades");
          } finally {
            setLoading(false);
          }
        }}>Reintentar</button>
      </section>
    );
  }

  return (
    <section aria-label="Gestionar amistades" className="min-w-0">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={refreshRelationships}
          disabled={Boolean(activeAction) || searching}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${activeAction === "refresh" ? "animate-spin" : ""}`} />
          {activeAction === "refresh" ? "Actualizando…" : "Actualizar amistades"}
        </button>
      </div>

      {error ? (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-teal-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Añadir amigos</h2>
            <p className="mt-0.5 text-xs text-slate-400">Busca por nombre de usuario.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 focus-within:border-teal-300/40">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="sr-only">Nombre de usuario</span>
            <input
              value={query}
              onChange={(event) => {
                searchVersion.current += 1;
                setQuery(event.target.value);
                setResults([]);
                setSearched(false);
                setSearching(false);
                setError("");
              }}
              maxLength={15}
              placeholder="Ejemplo: david"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
          <button
            type="submit"
            disabled={searching || Boolean(activeAction) || query.trim().length < 2}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </form>

        {searched ? (
          <div className="mt-4 space-y-2">
            {results.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-slate-400">
                No se encontraron usuarios con ese nombre.
              </p>
            ) : results.map((user) => (
              <article key={user.username} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-3 sm:flex-row sm:items-center sm:justify-between">
                <UserIdentity user={user} />
                {user.status === "ACCEPTED" ? (
                  <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-400/10 px-3 text-xs font-semibold text-teal-200">
                    <Check className="h-4 w-4" /> Amigos
                  </span>
                ) : user.status === "PENDING" && user.direction === "OUTGOING" ? (
                  <button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => removeRelationship(user, `Solicitud a @${user.username} cancelada`)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
                  >
                    <Clock3 className="h-4 w-4" /> Cancelar solicitud
                  </button>
                ) : user.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={`Aceptar solicitud de ${user.username}`}
                      disabled={Boolean(activeAction)}
                      onClick={() => updateRequest(user, "accept")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300 text-slate-950 transition hover:bg-teal-200"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Rechazar solicitud de ${user.username}`}
                      disabled={Boolean(activeAction)}
                      onClick={() => updateRequest(user, "reject")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-200 transition hover:bg-rose-400/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => sendRequest(user)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    {isBusy(`send-${user.username}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {user.status === "REJECTED" ? "Volver a enviar" : "Añadir"}
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : null}
      </div>

      {overview.incomingRequests.length > 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-teal-300/20 bg-teal-400/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-teal-300" />
            <h2 className="text-sm font-semibold text-white">
              Solicitudes recibidas ({overview.incomingRequests.length})
            </h2>
          </div>
          <div className="mt-4 space-y-2">
            {overview.incomingRequests.map((request) => (
              <article key={request.friendshipId} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <UserIdentity user={request} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => updateRequest(request, "accept")}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-300 px-3 text-xs font-semibold text-slate-950 transition hover:bg-teal-200 disabled:opacity-60 sm:flex-none"
                  >
                    <Check className="h-4 w-4" /> Aceptar
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => updateRequest(request, "reject")}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-60 sm:flex-none"
                  >
                    <X className="h-4 w-4" /> Rechazar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-teal-300" />
              <h2 className="text-base font-semibold text-white">Tus amigos</h2>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {overview.friends.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {overview.friends.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm leading-6 text-slate-400">
                Todavía no tienes amigos. Busca a otro conductor para empezar vuestro ranking.
              </p>
            ) : overview.friends.map((friend) => (
              <article key={friend.friendshipId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                <UserIdentity user={friend} />
                {confirmingRemovalId === friend.friendshipId ? (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={Boolean(activeAction)}
                      onClick={() => {
                        removeRelationship(friend, `@${friend.username} ya no está en tu lista de amigos`);
                        setConfirmingRemovalId(null);
                      }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-rose-400/15 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/25 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Eliminar
                    </button>
                    <button
                      type="button"
                      aria-label="Cancelar eliminación"
                      onClick={() => setConfirmingRemovalId(null)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`Eliminar a ${friend.username} de tus amigos`}
                    title="Eliminar amistad"
                    disabled={Boolean(activeAction)}
                    onClick={() => setConfirmingRemovalId(friend.friendshipId)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">Solicitudes enviadas</h2>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {overview.outgoingRequests.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {overview.outgoingRequests.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
                No tienes solicitudes pendientes.
              </p>
            ) : overview.outgoingRequests.map((request) => (
              <article key={request.friendshipId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                <UserIdentity user={request} />
                <button
                  type="button"
                  aria-label={`Cancelar solicitud a ${request.username}`}
                  disabled={Boolean(activeAction)}
                  onClick={() => removeRelationship(request, `Solicitud a @${request.username} cancelada`)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
