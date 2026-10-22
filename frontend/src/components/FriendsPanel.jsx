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
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { Surface } from "./ui/surface";

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
    <div className="fl-user-identity">
      <span className="fl-user-avatar" aria-hidden="true">
        {user.username.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <Link
          to={`/users/${user.username}`}
          className="fl-community-link fl-user-name"
        >
          @{user.username}
        </Link>
        {name ? <p className="fl-user-description">{name}</p> : null}
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

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!overviewLoaded || normalizedQuery.length < 2 || activeAction) return;

    const controller = new AbortController();
    let active = true;
    const version = ++searchVersion.current;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setResults([]);
      setSearched(false);
      try {
        const data = await apiJson(`/api/friendships/search?username=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });
        if (active && version === searchVersion.current) {
          setResults(data);
          setSearched(true);
        }
      } catch (searchError) {
        if (active && version === searchVersion.current && searchError.name !== "AbortError") {
          setError(searchError.message || "No se pudo completar la búsqueda");
        }
      } finally {
        if (active && version === searchVersion.current) setSearching(false);
      }
    }, 600);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, activeAction, overviewLoaded]);

  const refreshRelationships = async () => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setActiveAction("refresh");
    setError("");
    try {
      await loadOverview();
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
    setActiveAction(key);
    setError("");
    try {
      await action();
      onNotify(successMessage);
      try {
        await loadOverview();
      } catch {
        setError("La acción se ha completado, pero no se pudo actualizar la lista. Recarga la página para ver los cambios.");
      }
    } catch (actionError) {
      const message = actionError.message || "No se pudo completar la acción";
      setError(message);
      onNotify(message, "error");
      // A request may have been answered or cancelled from another session.
      try {
        await loadOverview();
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
      <Surface as="section" role="status" aria-live="polite" className="fl-surface fl-workspace fl-community-state">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Cargando amistades...
      </Surface>
    );
  }

  if (!overviewLoaded) {
    return (
      <Surface as="section" role="alert" className="fl-surface fl-workspace fl-community-error">
        <p>{error || "No se pudieron cargar tus amistades"}</p>
        <Button type="button" variant="outline" className="fl-friend-action mt-4" onClick={async () => {
          setLoading(true);
          setError("");
          try {
            await loadOverview();
          } catch (loadError) {
            setError(loadError.message || "No se pudieron cargar tus amistades");
          } finally {
            setLoading(false);
          }
        }}>Reintentar</Button>
      </Surface>
    );
  }

  return (
    <section aria-label="Gestionar amistades" className="fl-friends-panel min-w-0">
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          onClick={refreshRelationships}
          pending={activeAction === "refresh"} pendingLabel="Actualizando…" disabled={Boolean(activeAction) || searching}
          variant="outline" className="fl-friend-action"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Actualizar amistades
        </Button>
      </div>

      {error ? (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="fl-surface fl-workspace fl-friend-search-section">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-primary" />
          <div>
            <h2 className="fl-section-title">Añadir amigos</h2>
          </div>
        </div>

        <div role="search" aria-label="Buscar amigos" className="mt-4">
          <label className="fl-friend-search">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Nombre de usuario</span>
            <Input
              type="search"
              aria-describedby="friend-search-hint"
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
              className="pl-11 pr-11"
            />
            {searching ? <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin text-primary" /> : null}
          </label>
          <p id="friend-search-hint" role="status" className="mt-2 text-xs text-muted-foreground">
            {searching ? "Buscando usuarios…" : searched ? `${results.length} ${results.length === 1 ? "usuario encontrado" : "usuarios encontrados"}` : "Escribe al menos 2 caracteres para buscar."}
          </p>
        </div>

        {searched ? (
          <div className="mt-4 space-y-2">
            {results.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-muted-foreground">
                No se encontraron usuarios con ese nombre.
              </p>
            ) : results.map((user) => (
              <article key={user.username} className="fl-friend-row">
                <UserIdentity user={user} />
                {user.status === "ACCEPTED" ? (
                  <span className="fl-community-tag">
                    <Check className="h-4 w-4" /> Amigos
                  </span>
                ) : user.status === "PENDING" && user.direction === "OUTGOING" ? (
                  <Button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => removeRelationship(user, `Solicitud a @${user.username} cancelada`)}
                    variant="outline" className="fl-friend-action"
                  >
                    <Clock3 className="h-4 w-4" /> Cancelar solicitud
                  </Button>
                ) : user.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      aria-label={`Aceptar solicitud de ${user.username}`}
                      disabled={Boolean(activeAction)}
                      onClick={() => updateRequest(user, "accept")}
                      variant="default" size="icon" className="fl-friend-action"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      aria-label={`Rechazar solicitud de ${user.username}`}
                      disabled={Boolean(activeAction)}
                      onClick={() => updateRequest(user, "reject")}
                      variant="destructive" size="icon" className="fl-friend-action"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => sendRequest(user)}
                    variant="default" className="fl-friend-action"
                  >
                    {isBusy(`send-${user.username}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {user.status === "REJECTED" ? "Volver a enviar" : "Añadir"}
                  </Button>
                )}
              </article>
            ))}
          </div>
        ) : null}
      </div>

      {overview.incomingRequests.length > 0 ? (
        <div className="fl-surface fl-workspace mt-5">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-primary" />
            <h2 className="fl-section-title">
              Solicitudes recibidas ({overview.incomingRequests.length})
            </h2>
          </div>
          <div className="mt-4 space-y-2">
            {overview.incomingRequests.map((request) => (
              <article key={request.friendshipId} className="fl-friend-row">
                <UserIdentity user={request} />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => updateRequest(request, "accept")}
                    variant="default" className="fl-friend-action flex-1 sm:flex-none"
                  >
                    <Check className="h-4 w-4" /> Aceptar
                  </Button>
                  <Button
                    type="button"
                    disabled={Boolean(activeAction)}
                    onClick={() => updateRequest(request, "reject")}
                    variant="destructive" className="fl-friend-action flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4" /> Rechazar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="fl-surface fl-workspace">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="fl-section-title">Tus amigos</h2>
            </div>
            <span className="fl-community-count">
              {overview.friends.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {overview.friends.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm leading-6 text-muted-foreground">
                Todavía no tienes amigos. Busca a otro conductor para empezar vuestro ranking.
              </p>
            ) : overview.friends.map((friend) => (
              <article key={friend.friendshipId} className="fl-friend-row">
                <UserIdentity user={friend} />
                {confirmingRemovalId === friend.friendshipId ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      disabled={Boolean(activeAction)}
                      onClick={() => {
                        removeRelationship(friend, `@${friend.username} ya no está en tu lista de amigos`);
                        setConfirmingRemovalId(null);
                      }}
                      variant="destructive" className="fl-friend-action"
                    >
                      <Check className="h-4 w-4" /> Eliminar
                    </Button>
                    <Button
                      type="button"
                      aria-label="Cancelar eliminación"
                      onClick={() => setConfirmingRemovalId(null)}
                      variant="outline" size="icon" className="fl-friend-action"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    aria-label={`Eliminar a ${friend.username} de tus amigos`}
                    title="Eliminar amistad"
                    disabled={Boolean(activeAction)}
                    onClick={() => setConfirmingRemovalId(friend.friendshipId)}
                    variant="destructive" size="icon" className="fl-friend-action"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="fl-surface fl-workspace">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="fl-section-title">Solicitudes enviadas</h2>
            </div>
            <span className="fl-community-count">
              {overview.outgoingRequests.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {overview.outgoingRequests.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted-foreground">
                No tienes solicitudes pendientes.
              </p>
            ) : overview.outgoingRequests.map((request) => (
              <article key={request.friendshipId} className="fl-friend-row">
                <UserIdentity user={request} />
                <Button
                  type="button"
                  aria-label={`Cancelar solicitud a ${request.username}`}
                  disabled={Boolean(activeAction)}
                  onClick={() => removeRelationship(request, `Solicitud a @${request.username} cancelada`)}
                  variant="outline" className="fl-friend-action"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
