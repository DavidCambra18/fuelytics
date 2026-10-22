import { Button } from "./ui/button";
import { Input } from "./ui/field";
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
    <section aria-labelledby="delete-account-title" className="fl-settings-section fl-settings-danger">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-rose-300" />
        <div>
          <h2 id="delete-account-title" className="text-xl font-semibold text-white">Eliminar mi cuenta</h2>
          <p id="delete-account-description" className="mt-2 text-sm leading-6 text-slate-400">
            Se eliminarán permanentemente tu perfil, vehículos, repostajes, gastos, neumáticos, insignias y relaciones de amistad, incluidas las solicitudes pendientes. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>

      <Button
        ref={triggerRef}
        type="button"
        aria-expanded={confirming}
        aria-controls={confirming ? "delete-account-confirmation" : undefined}
        disabled={confirming}
        onClick={() => setConfirming(true)}
        variant="destructive" className="mt-5 h-auto min-h-11 whitespace-normal py-3 disabled:hidden"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" /> Eliminar mi cuenta
      </Button>

      {confirming ? (
        <form id="delete-account-confirmation" aria-label="Confirmar eliminación de cuenta" aria-describedby="delete-account-description" aria-busy={deleting} onSubmit={deleteAccount} className="mt-6 space-y-4 border-t border-white/10 pt-5">
          {error ? <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</p> : null}
          {googleOnly ? <label className="block text-sm text-slate-300">Escribe ELIMINAR para confirmar
            <Input ref={passwordRef} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={deleting} autoComplete="off" className="mt-2" />
            <span className="mt-2 block text-sm text-slate-400">Después deberás confirmar tu identidad con la cuenta de Google vinculada. Al confirmarla, se eliminará tu cuenta de Fuelytics.</span>
          </label> : <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Confirma tu contraseña actual</span>
            <Input
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
              required
              maxLength={72}
              disabled={deleting}
              className="mt-2"
            />
          </label>}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-slate-300">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} disabled={deleting} required className="mt-1 h-4 w-4 shrink-0 accent-rose-400" />
            Entiendo que se borrarán mi cuenta y todos sus datos de forma permanente.
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" onClick={cancel} disabled={deleting} variant="outline" className="h-auto min-h-11 whitespace-normal py-2.5">Cancelar</Button>
            {!googleOnly ? <Button type="submit" disabled={deleting || !acknowledged || !password.trim()} variant="destructive" className="h-auto min-h-11 whitespace-normal py-2.5">
              {deleting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
              {deleting ? "Eliminando cuenta…" : "Eliminar cuenta definitivamente"}
            </Button> : null}
          </div>
          {googleOnly && !googleEnabled ? <p role="alert" className="text-sm text-rose-300">Google no está disponible en este entorno. No se puede confirmar la eliminación.</p> : null}
          {googleOnly && googleEnabled && acknowledged && confirmation === "ELIMINAR" ? <GoogleIdentityButton purpose="DELETE_ACCOUNT" onVerified={(proof) => deleteAccount(null, proof)} /> : null}
        </form>
      ) : null}
    </section>
  );
}
