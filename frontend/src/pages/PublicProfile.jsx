import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { optionalResource } from "../utils/optionalResource";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { ArrowLeft, AlertCircle, User, Car, Calendar, Medal, Award, Fuel, Receipt, Leaf, Wrench } from "lucide-react";

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

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [rankingPositions, setRankingPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [badgesError, setBadgesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadProfileData = async () => {
      setLoading(true);
      setError("");
      setBadgesError("");
      setProfile(null);
      setRankingPositions([]);

      try {
        const [profileRes, rankingRes, badgesRes] = await Promise.all([
          apiFetch(`/api/users/public/${encodeURIComponent(username)}`, { signal: controller.signal }),
          apiFetch("/api/ranking", { signal: controller.signal }),
          optionalResource(apiFetch(`/api/badges/public/${encodeURIComponent(username)}`, { signal: controller.signal }), { signal: controller.signal, fallback: [], message: "No se pudieron cargar las insignias públicas. Vuelve a intentarlo más tarde." })
        ]);

        if (!profileRes.ok) {
          const errorData = await profileRes.json().catch(() => ({}));
          throw new Error(errorData.message || (profileRes.status === 403 ? "Este perfil es privado" : "No se pudo cargar el perfil"));
        }

        const profileData = await profileRes.json();
        if (controller.signal.aborted) return;
        const badgesData = badgesRes.data;
        setBadgesError(badgesRes.error);
        setProfile({
          ...profileData,
          badges: badgesData
        });

        if (rankingRes.ok) {
          const rankingData = await rankingRes.json();
          const top3 = rankingData.slice(0, 3);

          const positions = top3
            .map((r, index) => (r.username === profileData.username ? index + 1 : null))
            .filter((pos) => pos !== null);

          if (!controller.signal.aborted) setRankingPositions(positions);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(fetchError.message || "No se pudo cargar el perfil");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (username) {
      loadProfileData();
    }
    return () => controller.abort();
  }, [username]);

  const getInitial = () => {
    if (!profile) return "U";
    if (profile.username) return profile.username.charAt(0).toUpperCase();
    return "U";
  };

  if (loading) {
    return (
      <div className="public-app-loading section-shell py-10 text-slate-100">
        <Surface as="section" role="status" aria-live="polite" className="fl-workspace fl-community-state mx-auto max-w-5xl">
          Cargando perfil...
        </Surface>
      </div>
    );
  }

  return (
    <div className="public-app-page fl-public-page fl-profile-page min-h-screen text-foreground">
      <main className="pb-10 pt-6 lg:pb-16">
        <div className="section-shell">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <Button asChild variant="outline"><Link
                to="/dashboard"
                >
                <ArrowLeft className="h-4 w-4" />
                Volver al garaje
              </Link></Button>
            </div>

            {error ? (
              <div role="alert" className="fl-community-error">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                {error}
              </div>
            ) : profile ? (
              <div className="space-y-6">

                <Surface as="section" className="fl-profile-hero">

                  <div className="fl-profile-heading">
                    <div className="fl-profile-identity">
                      <div className="fl-profile-avatar" aria-hidden="true">
                        {getInitial()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="fl-page-title break-words">
                          {profile.username}
                        </h1>
                        <p className="mt-1.5 text-base text-muted-foreground">@{profile.username}</p>

                        {rankingPositions.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {rankingPositions.map((pos) => (
                              <div key={pos} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${pos === 1 ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-400" :
                                  pos === 2 ? "border-slate-300/30 bg-slate-300/10 text-[var(--text-secondary)]" :
                                    "border-amber-600/30 bg-amber-600/10 text-amber-300"
                                }`}>
                                <Medal className="h-4 w-4" />
                                TOP {pos} Global
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Surface>

                <div className="grid gap-6 lg:grid-cols-3">

                  <section className="flex flex-col gap-4 lg:col-span-1">
                    <div className="fl-surface fl-workspace">
                      <h2 className="fl-section-title mb-5">Información</h2>

                      <div className="flex flex-col gap-5">
                        <article className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-900/80 text-muted-foreground">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Usuario</p>
                            <p className="break-words text-base font-semibold text-foreground">{profile.username}</p>
                          </div>
                        </article>
                      </div>
                    </div>
                  </section>

                  <section className="flex flex-col gap-4 lg:col-span-2">
                    <div className="fl-surface fl-workspace h-full">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="fl-section-title">Garaje visible</h2>
                        <Car className="h-5 w-5 text-primary" />
                      </div>

                      {profile.vehicles && profile.vehicles.filter(v => v.isPublic).length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {profile.vehicles.filter(v => v.isPublic).map((vehicle) => (
                            <Link
                              to={`/public/vehicles/${vehicle.id}`}
                              key={vehicle.id}
                              className="fl-profile-vehicle fl-community-link"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                                <Car className="h-6 w-6" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="break-words text-base font-semibold text-foreground">
                                  {vehicle.brand} {vehicle.model}
                                </h3>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{vehicle.year || "Año desconocido"}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 text-center">
                          <Car className="mb-3 h-8 w-8 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            Este usuario mantiene su garaje en privado o no tiene vehículos.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                </div>

                <Surface as="section" className="fl-surface fl-workspace">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="fl-section-title">Logros e insignias</h2>
                      <p className="mt-1 text-sm text-muted-foreground">El historial de hitos de este conductor.</p>
                    </div>
                    <Award className="h-6 w-6 text-amber-300" />
                  </div>

                  {badgesError ? <p role="alert" className="fl-feedback-error">{badgesError}</p> : profile.badges && profile.badges.length > 0 ? (
                    <div className="fl-profile-badges">
                      {profile.badges.map((badge, index) => {
                        const IconComponent = BADGE_ICONS[badge.iconName] || BADGE_ICONS.default;

                        return (
                          <div key={index} className="fl-profile-badge">
                            <div className="fl-profile-badge-icon">
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">{badge.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed flex-grow">{badge.description}</p>
                            <div className="fl-profile-badge-date">
                              <Calendar className="h-3 w-3" />
                              <span>Obtenido: {formatDateEs(badge.earnedDate)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
                      <Award className="mb-3 h-8 w-8 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Este usuario aún no ha desbloqueado ninguna insignia pública.
                      </p>
                    </div>
                  )}
                </Surface>

              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
