import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Fuel, Settings, Warehouse, User, LogOut, ChevronRight, ChevronUp, Trophy, Calculator, Users, PanelLeftClose, PanelLeftOpen, MoreHorizontal, X, Droplets, Compass } from "lucide-react";
import { useAuth } from "../context/auth";
import { apiFetch } from "../services/api";
import useDialogAccessibility from "../hooks/useDialogAccessibility";
import useOverlayMotion from "../hooks/useOverlayMotion";
import ViewportPortal from "./ViewportPortal";
import ProjectLinks from "./ProjectLinks";

const NAVIGATION = [
  { to: "/dashboard", label: "Garaje", tour: "garage", icon: Warehouse, matches: (path) => path === "/dashboard" || path.startsWith("/vehicles/") },
  { to: "/gas-stations", label: "Gasolineras", tour: "gas-stations", icon: Fuel },
  { to: "/ranking", label: "Clasificación", icon: Trophy },
  { to: "/friends", label: "Amigos", tour: "friends", icon: Users },
  { to: "/calculator", label: "Calculadora", tour: "calculator", icon: Calculator },
];
const ACCOUNT_LINKS = [
  { to: "/my-profile", label: "Mi perfil", icon: User },
  { to: "/settings", label: "Ajustes", icon: Settings },
];
const TOUR_LINK = { to: "/dashboard?tour=1", label: "Recorrido guiado", icon: Compass };
const MOBILE_LINKS = [NAVIGATION[0], NAVIGATION[1], NAVIGATION[3]];
const MORE_LINKS = [NAVIGATION[2], NAVIGATION[4], ...ACCOUNT_LINKS, TOUR_LINK];
const isCurrent = (item, pathname) => item.matches ? item.matches(pathname) : pathname === item.to;

function NavigationLink({ item, pathname, onNavigate, compact = false }) {
  const Icon = item.icon;
  return (
    <Link data-tour={item.tour} to={item.to} onClick={onNavigate} aria-current={isCurrent(item, pathname) ? "page" : undefined} aria-label={item.label} title={compact ? item.label : undefined} className="app-nav-link">
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className={compact ? "sr-only" : "min-w-0 truncate"}>{item.label}</span>
    </Link>
  );
}

export default function UserMenu({ expanded, onToggleSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username, clearAuth } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profilePanelRef = useRef(null);
  const { close: closeProfile, reopen: reopenProfile, isClosing: isProfileClosing } = useOverlayMotion(profileOpen, profilePanelRef, () => {
    if (profilePanelRef.current?.contains(document.activeElement) || document.activeElement === document.body) profileButtonRef.current?.focus({ preventScroll: true });
    setProfileOpen(false);
  }, "menu");
  const { dialogRef, titleId, close: closeMobile } = useDialogAccessibility(mobileOpen, () => setMobileOpen(false), "sheet");
  const initial = (username || "U").slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    apiFetch("/api/users/profile", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data && !controller.signal.aborted) setFullName([data.firstName, data.lastName].filter(Boolean).join(" "));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [username, pathname]);

  useEffect(() => {
    const closeOnHistoryNavigation = () => {
      setProfileOpen(false);
      setMobileOpen(false);
    };
    window.addEventListener("popstate", closeOnHistoryNavigation);
    return () => window.removeEventListener("popstate", closeOnHistoryNavigation);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    profilePanelRef.current?.querySelector("a")?.focus();
    const closeOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) closeProfile();
    };
    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        closeProfile();
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [profileOpen, closeProfile]);

  const closeNavigation = () => {
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const logout = () => {
    closeNavigation();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside className="app-sidebar" aria-label="Navegación de Fuelytics">
        <div className="app-sidebar-brand">
          <Link to="/dashboard" onClick={closeNavigation} aria-label="Fuelytics · Ir al garaje" title={expanded ? undefined : "Fuelytics"} className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-teal-300">
            <span className="app-brand-icon"><Droplets className="h-6 w-6" aria-hidden="true" /></span>
            {expanded ? <span className="text-lg font-semibold tracking-tight text-white">Fuelytics<span className="text-teal-300">.</span></span> : null}
          </Link>
        </div>

        <div className="app-sidebar-navigation">
          {expanded ? <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tu espacio</p> : null}
          <nav aria-label="Navegación principal" className="space-y-1.5">
            {NAVIGATION.map((item) => <NavigationLink key={item.to} item={item} pathname={pathname} compact={!expanded} onNavigate={closeNavigation} />)}
          </nav>
        </div>

        <div className="app-sidebar-footer">
          <nav aria-label="Enlaces del proyecto"><ProjectLinks onNavigate={closeNavigation} compact={!expanded} /></nav>
          <button type="button" onClick={() => { setProfileOpen(false); onToggleSidebar(); }} aria-label={expanded ? "Contraer menú lateral" : "Expandir menú lateral"} aria-expanded={expanded} className="app-sidebar-toggle">
            {expanded ? <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden="true" /> : <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />}
            {expanded ? <span>Contraer menú</span> : null}
          </button>

          <div ref={profileRef} className="relative mt-3 border-t border-white/[0.07] pt-3">
            <button ref={profileButtonRef} data-tour="account" type="button" onClick={() => { if (!profileOpen) setProfileOpen(true); else if (isProfileClosing()) reopenProfile(); else closeProfile(); }} aria-label="Menú de usuario" aria-expanded={profileOpen} aria-controls={profileOpen ? "profile-options" : undefined} data-current={ACCOUNT_LINKS.some((item) => isCurrent(item, pathname)) || undefined} title={expanded ? undefined : username || "Mi cuenta"} className="app-profile-trigger">
              <span className="app-profile-avatar">{initial}</span>
              {expanded ? <><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-slate-100">{username || "Usuario"}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{fullName || "Mi cuenta"}</span></span><ChevronUp className={`h-4 w-4 shrink-0 text-muted-foreground transition ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" /></> : null}
            </button>
            {profileOpen ? (
              <div ref={profilePanelRef} id="profile-options" className="app-profile-popover">
                <p className="mb-2 truncate px-3 pt-2 text-xs font-medium text-muted-foreground">@{username}</p>
                <nav aria-label="Opciones de la cuenta" className="space-y-1">
                  {[...ACCOUNT_LINKS, TOUR_LINK].map((item) => <NavigationLink key={item.to} item={item} pathname={pathname} onNavigate={closeNavigation} />)}
                </nav>
                <button type="button" onClick={logout} className="app-logout-button"><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión</button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <nav className="app-mobile-navigation" aria-label="Navegación principal móvil">
        {MOBILE_LINKS.map((item) => {
          const Icon = item.icon;
          return <Link key={item.to} data-tour={item.tour} to={item.to} onClick={closeNavigation} aria-current={isCurrent(item, pathname) ? "page" : undefined} className="app-mobile-link"><Icon className="h-5 w-5" aria-hidden="true" /><span>{item.label}</span></Link>;
        })}
        <button type="button" data-tour="mobile-more" onClick={() => setMobileOpen(true)} aria-expanded={mobileOpen} aria-controls={mobileOpen ? "mobile-more" : undefined} className={`app-mobile-link ${MORE_LINKS.some((item) => isCurrent(item, pathname)) ? "is-current" : ""}`}><MoreHorizontal className="h-5 w-5" aria-hidden="true" /><span>Más</span></button>
      </nav>

      {mobileOpen ? (
        <ViewportPortal>
          <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMobile(); }}>
            <div ref={dialogRef} id="mobile-more" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="app-mobile-sheet">
              <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-teal-300">Fuelytics</p><h2 id={titleId} className="mt-1 text-xl font-semibold text-white">Más opciones</h2></div><button type="button" onClick={closeMobile} aria-label="Cerrar más opciones" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-slate-300"><X className="h-5 w-5" /></button></div>
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4"><span className="app-profile-avatar">{initial}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{username}</p>{fullName ? <p className="mt-1 truncate text-xs text-muted-foreground">{fullName}</p> : null}</div></div>
              <nav aria-label="Más secciones" className="space-y-1.5">
                {MORE_LINKS.map((item) => <NavigationLink key={item.to} item={item} pathname={pathname} onNavigate={closeNavigation} />)}
                <ProjectLinks onNavigate={closeNavigation} />
              </nav>
              <button type="button" onClick={logout} className="app-logout-button"><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión<ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        </ViewportPortal>
      ) : null}
    </>
  );
}
