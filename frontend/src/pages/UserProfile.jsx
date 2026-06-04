import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function UserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch(`/api/users/public/${encodeURIComponent(username)}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || (response.status === 403 ? "Este perfil es privado" : "No se pudo cargar el perfil"));
        }

        const data = await response.json();
        setProfile(data);
      } catch (fetchError) {
        setError(fetchError.message || "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="section-shell py-10 text-slate-100">
        <section className="glass-panel rounded-[2rem] p-8 text-sm text-slate-300">Cargando perfil...</section>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-6 lg:pb-16">
        <div className="section-shell">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            {error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                {error}
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Perfil</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {(profile.firstName || profile.lastName)
                      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
                      : profile.username}
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">@{profile.username}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Usuario</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                      <p>{profile.username}</p>
                    </div>
                  </article>
                  <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nombre</p>
                    <p className="mt-2 text-lg font-semibold text-white">{profile.firstName || "No definido"}</p>
                  </article>
                  <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Apellidos</p>
                    <p className="mt-2 text-lg font-semibold text-white">{profile.lastName || "No definido"}</p>
                  </article>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 justify-center rounded-2xl border border-teal-300/25 bg-slate-950/85 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-teal-300/40 hover:bg-slate-900/95 hover:text-teal-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al garaje
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}