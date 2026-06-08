import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { ArrowLeft, AlertCircle, User, Car, Calendar, Medal } from "lucide-react";

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [rankingPositions, setRankingPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      setError("");

      try {
        const [profileRes, rankingRes] = await Promise.all([
          apiFetch(`/api/users/public/${encodeURIComponent(username)}`),
          apiFetch("/api/ranking")
        ]);

        if (!profileRes.ok) {
          const errorData = await profileRes.json().catch(() => ({}));
          throw new Error(errorData.message || (profileRes.status === 403 ? "Este perfil es privado" : "No se pudo cargar el perfil"));
        }

        const profileData = await profileRes.json();
        setProfile(profileData);

        if (rankingRes.ok) {
          const rankingData = await rankingRes.json();
          const top3 = rankingData.slice(0, 3);
          
          const positions = top3
            .map((r, index) => (r.username === profileData.username ? index + 1 : null))
            .filter((pos) => pos !== null);
            
          setRankingPositions(positions);
        }
      } catch (fetchError) {
        setError(fetchError.message || "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfileData();
    }
  }, [username]);

  const getInitial = () => {
    if (!profile) return "U";
    if (profile.username) return profile.username.charAt(0).toUpperCase();
    return "U";
  };

  if (loading) {
    return (
      <div className="section-shell py-10 text-slate-100">
        <section className="glass-panel mx-auto max-w-5xl rounded-[2rem] p-8 text-sm text-slate-300">
          Cargando perfil...
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-6 lg:pb-16">
        <div className="section-shell">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al garaje
              </Link>
            </div>

            {error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                {error}
              </div>
            ) : profile ? (
              <div className="space-y-6">
                
                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-teal-900/20 to-transparent pointer-events-none"></div>
                  
                  <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-teal-950 text-4xl font-bold text-teal-400 ring-2 ring-teal-500/20 sm:h-28 sm:w-28 sm:text-5xl">
                        {getInitial()}
                      </div>
                      <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                          {profile.username}
                        </h1>
                        <p className="mt-1.5 text-base text-slate-400">@{profile.username}</p>
                        
                        {rankingPositions.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            {rankingPositions.map((pos) => (
                              <div key={pos} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                                pos === 1 ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-400" :
                                pos === 2 ? "border-slate-300/30 bg-slate-300/10 text-slate-300" :
                                "border-amber-600/30 bg-amber-600/10 text-amber-500"
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
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                  
                  <section className="flex flex-col gap-4 lg:col-span-1">
                    <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                      <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Información</h2>
                      
                      <div className="flex flex-col gap-5">
                        <article className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/5 bg-slate-900/80 text-slate-400">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-500">Usuario</p>
                            <p className="truncate text-base font-semibold text-white">{profile.username}</p>
                          </div>
                        </article>
                      </div>
                    </div>
                  </section>

                  <section className="flex flex-col gap-4 lg:col-span-2">
                    <div className="h-full rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Garaje Visible</h2>
                        <Car className="h-5 w-5 text-teal-500/50" />
                      </div>

                      {profile.vehicles && profile.vehicles.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {profile.vehicles.map((vehicle) => (
                            <Link
                              to={`/public/vehicles/${vehicle.id}`}
                              key={vehicle.id} 
                              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition hover:border-teal-500/30 hover:bg-slate-900/80 cursor-pointer"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-teal-400">
                                <Car className="h-6 w-6" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-base font-semibold text-white">
                                  {vehicle.brand} {vehicle.model}
                                </h3>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{vehicle.year || "Año desconocido"}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 text-center">
                          <Car className="mb-3 h-8 w-8 text-slate-500 opacity-50" />
                          <p className="text-sm text-slate-400">
                            Este usuario mantiene su garaje en privado o no tiene vehículos.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}