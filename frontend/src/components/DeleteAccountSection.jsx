import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import GoogleIdentityButton from "./GoogleIdentityButton";

export default function DeleteAccountSection({ googleOnly = false, googleEnabled = true }) {
  const { clearAuth } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef(null);
  const triggerRef = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (confirming && !deleting) passwordRef.current?.focus();
  }, [confirming, deleting]);

  const cancel = () => {
    if (inFlight.current) return;
    setConfirming(false);
    setPassword("");
    setConfirmation("");
    setAcknowledged(false);
    setError("");
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const deleteAccount = async (event, googleProof) => {
    event?.preventDefault();
    if (inFlight.current || !acknowledged || (googleOnly ? !googleProof || confirmation !== "ELIMINAR" : !password.trim())) return;
    inFlight.current = true;
    setDeleting(true);
    setError("");
    try {
      await apiJson(googleOnly ? "/api/auth/google/account" : "/api/users/account", { method: "DELETE", body: googleOnly ? googleProof : { password } });
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      clearAuth();
      navigate("/login", { replace: true, state: { accountDeleted: true } });
    } catch (deleteError) {
      // GoogleIdentityButton displays Google errors and provides a fresh challenge on retry.
      if (!googleProof) setError(deleteError.message || "No se pudo eliminar tu cuenta");
      setPassword("");
      passwordRef.current?.focus();
      if (googleProof) throw deleteError;
    } finally {
      inFlight.current = false;
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="delete-account-title" className="rounded-[1.75rem] border border-rose-400/20 bg-slate-950/45 p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-rose-300" />
        <div>
          <h2 id="delete-account-title" className="text-xl font-semibold text-white">Eliminar mi cuenta</h2>
          <p id="delete-account-description" className="mt-2 text-sm leading-6 text-slate-400">
            Se eliminarán permanentemente tu perfil, vehículos, repostajes, gastos, neumáticos, insignias y relaciones de amistad, incluidas las solicitudes pendientes. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={confirming}
        aria-controls={confirming ? "delete-account-confirmation" : undefined}
        disabled={confirming}
        onClick={() => setConfirming(true)}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:hidden"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" /> Eliminar mi cuenta
      </button>

      {confirming ? (
        <form id="delete-account-confirmation" aria-label="Confirmar eliminación de cuenta" aria-describedby="delete-account-description" aria-busy={deleting} onSubmit={deleteAccount} className="mt-6 space-y-4 border-t border-white/10 pt-5">
          {error ? <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</p> : null}
          {googleOnly ? <label className="block text-sm text-slate-300">Escribe ELIMINAR para confirmar
            <input ref={passwordRef} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={deleting} autoComplete="off" className="mt-2 min-h-12 w-full rounded-2xl border border-rose-400/20 bg-slate-950/60 px-4 text-white" />
            <span className="mt-2 block text-sm text-slate-400">Después deberás confirmar tu identidad con la cuenta de Google vinculada. Al confirmarla, se eliminará tu cuenta de Fuelytics.</span>
          </label> : <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Confirma tu contraseña actual</span>
            <input
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
              required
              maxLength={72}
              disabled={deleting}
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none focus:border-rose-300/50 focus:ring-2 focus:ring-rose-300/20 disabled:opacity-50"
            />
          </label>}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-slate-300">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} disabled={deleting} required className="mt-1 h-4 w-4 shrink-0 accent-rose-400" />
            Entiendo que se borrarán mi cuenta y todos sus datos de forma permanente.
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={cancel} disabled={deleting} className="min-h-12 rounded-2xl border border-white/10 px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">Cancelar</button>
            {!googleOnly ? <button type="submit" disabled={deleting || !acknowledged || !password.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50">
              {deleting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
              {deleting ? "Eliminando cuenta…" : "Eliminar cuenta definitivamente"}
            </button> : null}
          </div>
          {googleOnly && !googleEnabled ? <p role="alert" className="text-sm text-rose-300">Google no está disponible en este entorno. No se puede confirmar la eliminación.</p> : null}
          {googleOnly && googleEnabled && acknowledged && confirmation === "ELIMINAR" ? <GoogleIdentityButton purpose="DELETE_ACCOUNT" onVerified={(proof) => deleteAccount(null, proof)} /> : null}
        </form>
      ) : null}
    </section>
  );
}
