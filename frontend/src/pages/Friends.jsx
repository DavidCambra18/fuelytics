import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Trophy, X } from "lucide-react";
import FriendsPanel from "../components/FriendsPanel";
import ViewportPortal from "../components/ViewportPortal";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";

export default function Friends() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  return (
    <main className="fl-community-page pb-10 text-foreground lg:pb-16">
      <div className="section-shell space-y-6">
        <Surface as="header" className="fl-workspace fl-community-heading">
          <div className="min-w-0">
            <h1 className="fl-page-title">Amigos</h1>
            <p className="fl-supporting mt-3 max-w-xl">Encuentra a otros conductores, conecta con tus amigos y compara la eficiencia de vuestros vehículos.</p>
          </div>
          <Button asChild variant="outline" className="fl-community-heading-action">
            <Link to="/ranking?tab=friends"><Trophy aria-hidden="true" />Clasificación de amigos<ArrowRight aria-hidden="true" /></Link>
          </Button>
        </Surface>

        <FriendsPanel onNotify={(message, tone = "success") => setNotification({ message, tone })} />
      </div>

      <ViewportPortal>
      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 sm:left-auto sm:right-6 sm:top-6" aria-live="polite" aria-atomic="true">
        {notification ? (
          <div className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border bg-popover p-4 shadow-[var(--shadow-floating)] ${notification.tone === "error" ? "border-rose-400/30 text-rose-100" : "border-teal-300/30 text-teal-100"}`}>
            {notification.tone === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
            <p className="min-w-0 flex-1 text-sm">{notification.message}</p>
            <Button type="button" variant="ghost" size="icon" onClick={() => setNotification(null)} aria-label="Cerrar aviso">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
      </ViewportPortal>
    </main>
  );
}
