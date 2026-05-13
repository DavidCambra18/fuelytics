import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserMenu() {
  const navigate = useNavigate();
  const { username, clearAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    clearAuth();
    navigate("/login");
  };

  return (
    <div ref={menuRef} className="fixed left-5 top-5 z-40">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/15 text-sm font-semibold text-teal-200 ring-1 ring-teal-300/20">
            {(username || "U").slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden pr-2 text-sm font-medium text-white sm:block">
            {username || "Usuario"}
          </span>
        </button>
        <Link
          to="/dashboard"
          aria-label="Ir al garaje"
          title="Garaje"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-teal-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" />
            <path d="M5 21V8.5a1 1 0 0 1 .4-.8l6-4.5a1 1 0 0 1 1.2 0l6 4.5a1 1 0 0 1 .4.8V21" />
            <path d="M8 21v-4h8v4" />
            <path d="M9 11h6" />
            <path d="M9 14h6" />
          </svg>
        </Link>
      </div>

      {open ? (
        <div className="mt-3 w-80 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-br from-teal-400/10 via-cyan-400/5 to-transparent px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/15 text-base font-semibold text-teal-200 ring-1 ring-teal-300/20">
                {(username || "U").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{username || "Usuario"}</p>
                <p className="mt-0.5 text-xs text-slate-400">Sesión activa</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 p-3">
            <button
              type="button"
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.08]"
            >
              <div>
                <p className="text-sm font-medium text-white">Ajustes</p>
                <p className="mt-1 text-xs text-slate-400">Perfil y preferencias</p>
              </div>
              <span className="text-slate-500 transition group-hover:text-slate-300">›</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="group flex items-center justify-between rounded-2xl border border-rose-400/20 bg-gradient-to-r from-rose-400/10 to-rose-500/10 px-4 py-3 text-left transition hover:border-rose-300/30 hover:from-rose-400/15 hover:to-rose-500/15"
            >
              <div>
                <p className="text-sm font-medium text-rose-100">Cerrar sesión</p>
                <p className="mt-1 text-xs text-rose-200/70">Salir de esta cuenta</p>
              </div>
              <span className="text-rose-200/70 transition group-hover:text-rose-100">›</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}