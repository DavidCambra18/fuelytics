import useActionGuard from "../hooks/useActionGuard";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import { queueWelcomeTour } from "../utils/onboarding";
import { validateUsername } from "../utils/registrationValidation";
import useRegistrationAvailability from "../hooks/useRegistrationAvailability";
import GoogleIdentityButton from "./GoogleIdentityButton";

export default function GoogleSignInPanel({ onRegistrationChange }) {
  const { guard, isActive } = useActionGuard();
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

  const authenticate = guard(async (proof) => {
    const result = await apiJson("/api/auth/google/login", { method: "POST", body: proof });
    if (!isActive()) return;
    if (result.registrationRequired) {
      setPending(result);
      onRegistrationChange?.(true);
    }
    else finish(result);
  });

  const register = guard(async (event) => {
    event.preventDefault();
    if (busy || validation || availability.error || availability.status === "checking") return;
    setBusy(true);
    setError("");
    try {
      const result = await apiJson("/api/auth/google/register", { method: "POST", body: { registrationToken: pending.registrationToken, username: normalized } });
      queueWelcomeTour(result.username);
      if (!isActive()) return;
      finish(result);
    } catch (error) {
      if (!isActive()) return;
      setError(error.message);
    } finally { setBusy(false); }
  });

  if (!pending) return <GoogleIdentityButton onVerified={authenticate} separator />;
  return (
    <form aria-busy={busy} onSubmit={register} className="fl-google-completion">
      <h3 className="font-semibold text-white">Completa tu cuenta de Google</h3>
      <p className="break-all text-sm text-slate-400">{pending.email}</p>
      <p className="text-sm text-slate-400">Elige cómo quieres aparecer en Fuelytics. No necesitas crear una contraseña.</p>
      <label className="block text-sm text-slate-300">Nombre de usuario
        <Input ref={usernameRef} autoComplete="username" required minLength={3} maxLength={15} disabled={busy} value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} className="mt-2" />
      </label>
      {error || (username && validation) || availability.error || availability.warning ? <p role={error ? "alert" : "status"} className="text-sm text-rose-300">{error || validation || availability.error || availability.warning}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button pending={busy} pendingLabel="Creando cuenta…" disabled={busy || !!validation || !!availability.error || availability.status === "checking"} className="h-auto min-h-11 whitespace-normal py-2.5">Crear cuenta con Google</Button>
        <Button type="button" disabled={busy} onClick={() => { setPending(null); setUsername(""); setError(""); onRegistrationChange?.(false); }} variant="ghost">Usar otra cuenta</Button>
      </div>
    </form>
  );
}
