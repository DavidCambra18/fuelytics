import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config/api";

export default function UserProfile() {
  const { username } = useParams();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/users/public/${encodeURIComponent(username)}`, {
          headers,
        });

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
  }, [username, token]);

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
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Perfil público</p>
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
                    <p className="mt-2 text-lg font-semibold text-white">{profile.username}</p>
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

                <div className="flex gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-teal-300/25 bg-slate-950/85 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-teal-300/40 hover:bg-slate-900/95 hover:text-teal-100"
                  >
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