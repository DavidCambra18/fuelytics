import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { useEffect, useRef, useState } from "react";
import { Check, KeyRound, Link2, ShieldCheck } from "lucide-react";
import { apiJson } from "../services/api";
import GoogleIdentityButton from "./GoogleIdentityButton";
import DeleteAccountSection from "./DeleteAccountSection";

export default function AccountAccessSection() {
  const [status, setStatus] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmingLink, setConfirmingLink] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const managingTriggerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    apiJson("/api/auth/google/status", { signal: controller.signal }).then(setStatus).catch((error) => {
      if (!controller.signal.aborted) setError(error.message);
    });
    return () => controller.abort();
  }, [attempt]);

  const linked = async (proof) => {
    setBusy(true);
    try {
      await apiJson("/api/auth/google/link", { method: "POST", body: { ...proof, password } });
      setStatus((current) => ({ ...current, linked: true }));
      setConfirmingLink(false);
      setManaging(false);
      setPassword("");
      setNotice("Google está vinculado. Ya puedes utilizarlo para iniciar sesión.");
    } finally { setBusy(false); }
  };

  const unlink = async (event) => {
    event.preventDefault();
    if (busy || !password.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiJson("/api/auth/google/link", { method: "DELETE", body: { password } });
      setStatus((current) => ({ ...current, linked: false }));
      setManaging(false);
      setPassword("");
      setNotice("Google se ha desvinculado. Puedes seguir entrando con tu correo y contraseña.");
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  if (!status) return <section className="fl-settings-section fl-supporting">{error ? <><p role="alert">{error}</p><Button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} variant="outline" className="mt-3">Reintentar</Button></> : <p role="status">Cargando métodos de acceso…</p>}</section>;

  return (
    <>
      <section className="fl-settings-section space-y-4">
        <h2 className="text-xl font-semibold text-white">Métodos de acceso</h2>
        <p className="text-sm leading-6 text-slate-400">Gestiona cómo inicias sesión en Fuelytics.</p>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {status.hasPassword ? (
            <div className="flex items-center gap-4 border-b border-white/10 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-300"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white">Correo y contraseña</h3>
                <p className="mt-1 text-sm leading-5 text-slate-400">Tu acceso con la contraseña de Fuelytics.</p>
              </div>
              <span className="hidden text-xs text-slate-400 sm:inline">Configurado</span>
            </div>
          ) : null}
          <div className={`p-4 sm:p-5 ${status.linked ? "bg-teal-300/[0.03]" : ""}`}>
            <div className="fl-account-provider">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white">
                <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.02 46.98 31.87 46.98 24.55Z" />
                  <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 className="font-semibold text-white">Google</h3>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.linked ? "border-teal-300/20 bg-teal-300/10 text-teal-200" : "border-white/10 bg-white/5 text-slate-400"}`}>
                    {status.linked ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {status.linked ? "Conectado" : "Sin conectar"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{status.linked ? "Tu cuenta de Google está conectada a Fuelytics. Puedes usarla para iniciar sesión." : "Conecta Google para entrar sin escribir tu contraseña de Fuelytics."}</p>
                {status.hasPassword && (status.enabled || status.linked) ? <Button ref={managingTriggerRef} type="button" disabled={busy || managing} onClick={() => { setManaging(true); setError(""); setNotice(""); }} variant="outline" className="mt-3 h-auto min-h-11 whitespace-normal py-2.5"><Link2 className="h-4 w-4" aria-hidden="true" />{status.linked ? "Desvincular" : "Conectar Google"}</Button> : null}
              </div>
            </div>
            {!status.hasPassword ? <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-teal-300/10 bg-teal-300/5 p-3 text-sm leading-6 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300/70" aria-hidden="true" /><p>Google es tu único método de acceso. Para que puedas seguir entrando, esta conexión debe permanecer activa.</p></div> : null}
          </div>
        </div>
        {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
        {notice ? <p role="status" className="text-sm text-teal-300">{notice}</p> : null}
        {!status.enabled && !status.linked ? <p className="text-sm text-slate-400">El acceso con Google todavía no está configurado.</p> : null}
        {managing && status.hasPassword && (status.enabled || status.linked) ? (
          <form onSubmit={status.linked ? unlink : (event) => { event.preventDefault(); setConfirmingLink(true); setError(""); setNotice(""); }} className="space-y-3">
            <label className="block text-sm text-slate-300">Confirma tu contraseña de Fuelytics
              <Input type="password" autoComplete="current-password" autoFocus required maxLength={72} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} disabled={busy || confirmingLink} className="mt-2" />
            </label>
            {!confirmingLink ? <Button disabled={busy || !password.trim()} variant="outline" className="h-auto min-h-11 whitespace-normal py-2.5">{busy ? "Guardando…" : status.linked ? "Desvincular Google" : "Continuar para vincular Google"}</Button> : null}
          </form>
        ) : null}
        {confirmingLink ? <GoogleIdentityButton purpose="LINK" onVerified={linked} /> : null}
        {managing ? <Button type="button" disabled={busy} onClick={() => { setManaging(false); setConfirmingLink(false); setPassword(""); setError(""); window.requestAnimationFrame(() => managingTriggerRef.current?.focus()); }} variant="ghost">Cancelar</Button> : null}
      </section>
      <DeleteAccountSection googleOnly={!status.hasPassword} googleEnabled={status.enabled} />
    </>
  );
}
