import { Suspense, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import useMediaQuery from "../hooks/useMediaQuery";

const SIDEBAR_PREFERENCE = "fuelytics:sidebar-mode";

export default function AppShell() {
  const { pathname } = useLocation();
  const hasSidebar = useMediaQuery("(min-width: 640px)");
  const [sidebarMode, setSidebarMode] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_PREFERENCE);
      return saved === "expanded" ? "expanded" : "collapsed";
    } catch {
      return "collapsed";
    }
  });
  const expanded = sidebarMode === "expanded";

  const toggleSidebar = () => {
    const nextMode = expanded ? "collapsed" : "expanded";
    setSidebarMode(nextMode);
    try {
      localStorage.setItem(SIDEBAR_PREFERENCE, nextMode);
    } catch {
      // Navigation still works when the browser cannot save the preference.
    }
  };

  return (
    <div className="app-shell" data-sidebar={expanded ? "expanded" : "collapsed"}>
      <a href="#app-content" className="sr-only fixed left-4 top-4 z-[90] rounded-xl bg-teal-300 px-4 py-3 font-semibold text-slate-950 focus:not-sr-only">Saltar al contenido</a>
      <UserMenu key={hasSidebar ? "sidebar" : "mobile"} expanded={expanded} onToggleSidebar={toggleSidebar} />
      <div id="app-content" tabIndex={-1} className="protected-page-content outline-none">
        <Suspense fallback={<div role="status" className="section-shell glass-panel rounded-[2rem] p-8 text-sm text-slate-400">Cargando contenido…</div>}>
          <Outlet key={pathname} />
        </Suspense>
      </div>
    </div>
  );
}
