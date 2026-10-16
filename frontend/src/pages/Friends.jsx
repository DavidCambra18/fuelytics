import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Trophy, Users, X } from "lucide-react";
import FriendsPanel from "../components/FriendsPanel";

export default function Friends() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  return (
    <main className="min-h-screen pb-10 pt-8 text-slate-100 sm:pt-24 lg:pb-16">
      <div className="section-shell space-y-6">
        <header className="glass-panel rounded-[2rem] p-5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                <Users className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Comunidad</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Amigos</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Encuentra a otros conductores, conecta con tus amigos y compara la eficiencia de vuestros vehículos.
                </p>
              </div>
            </div>
            <Link
              to="/ranking?tab=friends"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 text-sm font-semibold text-teal-200 transition hover:bg-teal-400/20"
            >
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Clasificación de amigos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <FriendsPanel onNotify={(message, tone = "success") => setNotification({ message, tone })} />
      </div>

      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 sm:left-auto sm:right-6 sm:top-6" aria-live="polite" aria-atomic="true">
        {notification ? (
          <div className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl ${notification.tone === "error" ? "border-rose-400/30 text-rose-100" : "border-teal-300/30 text-teal-100"}`}>
            {notification.tone === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
            <p className="min-w-0 flex-1 text-sm">{notification.message}</p>
            <button type="button" onClick={() => setNotification(null)} aria-label="Cerrar aviso" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
