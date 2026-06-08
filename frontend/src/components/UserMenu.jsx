import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import {
  Fuel,
  Settings as SettingsIcon,
  Warehouse,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  Trophy,
  Calculator
} from "lucide-react";

export default function UserMenu() {
  const navigate = useNavigate();
  const { username, clearAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    apiFetch("/api/users/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
          setFullName(name);
        }
      })
      .catch(() => { });
  }, [username]);

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
          className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/80 pl-2 pr-4 py-2 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/15 text-sm font-semibold text-teal-200 ring-1 ring-teal-300/20">
            {(username || "U").slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden text-sm font-medium text-white sm:block">
            {username || "Usuario"}
          </span>
          <ChevronDown className={`hidden h-4 w-4 text-teal-200/70 transition-transform duration-200 sm:block ${open ? "rotate-180" : ""}`} />
        </button>

        <Link
          to="/settings"
          aria-label="Editar perfil y ajustes"
          title="Ajustes"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <SettingsIcon className="h-5 w-5 text-teal-200" aria-hidden="true" />
        </Link>

        <Link
          to="/gas-stations"
          aria-label="Ir al mapa de gasolineras"
          title="Gasolineras"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <Fuel className="h-5 w-5 text-teal-200" aria-hidden="true" />
        </Link>

        <Link
          to="/ranking"
          aria-label="Ir al ranking global"
          title="Ranking Global"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <Trophy className="h-5 w-5 text-teal-200" aria-hidden="true" />
        </Link>

        <Link
          to="/dashboard"
          aria-label="Ir al garaje"
          title="Garaje"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <Warehouse className="h-5 w-5 text-teal-200" aria-hidden="true" />
        </Link>

        <Link
          to="/calculator"
          aria-label="Ir a la calculadora de viaje"
          title="Calculadora de viaje"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-teal-300/30 hover:bg-slate-900/90"
        >
          <Calculator className="h-5 w-5 text-teal-200" aria-hidden="true" />
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
                {fullName ? (
                  <p className="mt-0.5 truncate text-xs text-slate-400">{fullName}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-2 p-3">
            {username ? (
              <Link
                to="/my-profile"
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition group-hover:bg-slate-700 group-hover:text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Mi Perfil</p>
                    <p className="mt-0.5 text-xs text-slate-400">Ver tu perfil</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 transition group-hover:text-slate-300" />
              </Link>
            ) : null}

            <button
              type="button"
              onClick={logout}
              className="group flex items-center justify-between rounded-2xl border border-rose-400/20 bg-gradient-to-r from-rose-400/10 to-rose-500/10 p-3 text-left transition hover:border-rose-300/30 hover:from-rose-400/15 hover:to-rose-500/15"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 transition group-hover:bg-rose-500/30 group-hover:text-rose-200">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-100">Cerrar sesión</p>
                  <p className="mt-0.5 text-xs text-rose-200/70">Salir de esta cuenta</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-rose-200/70 transition group-hover:text-rose-100" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}