import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import { validateUsername } from "../utils/registrationValidation";
import useRegistrationAvailability from "../hooks/useRegistrationAvailability";
import GoogleIdentityButton from "./GoogleIdentityButton";

export default function GoogleSignInPanel({ onRegistrationChange }) {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef(null);
  useEffect(() => { if (pending) usernameRef.current?.focus(); }, [pending]);
  const normalized = username.trim();
  const validation = validateUsername(normalized);
  const availability = useRegistrationAvailability("username", pending ? normalized : "", validation);

  const finish = (result) => {
    if (!result.token || !result.username) throw new Error("No se pudo abrir la sesión. Vuelve a intentarlo.");
    try { localStorage.setItem("fuelytics:sidebar-mode", "collapsed"); } catch { /* Appearance must not block sign-in. */ }
    setAuth({ token: result.token, username: result.username });
    navigate("/dashboard", { replace: true });
  };

  const authenticate = async (proof) => {
    const result = await apiJson("/api/auth/google/login", { method: "POST", body: proof });
    if (result.registrationRequired) {
      setPending(result);
      onRegistrationChange?.(true);
    }
    else finish(result);
  };

  const register = async (event) => {
    event.preventDefault();
    if (busy || validation || availability.error || availability.status === "checking") return;
    setBusy(true);
    setError("");
    try {
      finish(await apiJson("/api/auth/google/register", { method: "POST", body: { registrationToken: pending.registrationToken, username: normalized } }));
    } catch (error) {
      setError(error.message);
    } finally { setBusy(false); }
  };

  if (!pending) return <GoogleIdentityButton onVerified={authenticate} separator />;
  return (
    <form onSubmit={register} className="my-5 space-y-4 rounded-2xl border border-teal-300/20 bg-teal-300/5 p-4">
      <h3 className="font-semibold text-white">Completa tu cuenta de Google</h3>
      <p className="break-all text-sm text-slate-400">{pending.email}</p>
      <p className="text-sm text-slate-400">Elige cómo quieres aparecer en Fuelytics. No necesitas crear una contraseña.</p>
      <label className="block text-sm text-slate-300">Nombre de usuario
        <input ref={usernameRef} autoComplete="username" required minLength={3} maxLength={15} disabled={busy} value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white" />
      </label>
      {error || (username && validation) || availability.error || availability.warning ? <p role="status" className="text-sm text-rose-300">{error || validation || availability.error || availability.warning}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || !!validation || !!availability.error || availability.status === "checking"} className="min-h-11 rounded-xl bg-teal-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? "Creando cuenta…" : "Crear cuenta con Google"}</button>
        <button type="button" disabled={busy} onClick={() => { setPending(null); setUsername(""); setError(""); onRegistrationChange?.(false); }} className="min-h-11 px-2 text-sm text-slate-300">Usar otra cuenta</button>
      </div>
    </form>
  );
}
