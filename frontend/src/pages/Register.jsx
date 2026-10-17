import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Check, X } from "lucide-react";
import { apiJson } from "../services/api";
import useRegistrationAvailability from "../hooks/useRegistrationAvailability";
import { normalizeRegistration, validateRegistration, REGISTRATION_LIMITS } from "../utils/registrationValidation";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [serverErrors, setServerErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const body = normalizeRegistration({ username, email, password, firstName, lastName });
  const validation = validateRegistration(body, confirmPassword);
  const usernameAvailability = useRegistrationAvailability("username", body.username, validation.username);
  const emailAvailability = useRegistrationAvailability("email", body.email, validation.email);
  const usernameError = ((username || attempted) && validation.username) || serverErrors.username || usernameAvailability.error;
  const emailError = ((email || attempted) && validation.email) || serverErrors.email || emailAvailability.error;
  const usernameStatus = usernameError ? "error" : usernameAvailability.status;
  const emailStatus = emailError ? "error" : emailAvailability.status;
  const firstNameError = validation.firstName || serverErrors.firstName;
  const lastNameError = validation.lastName || serverErrors.lastName;
  const passwordError = ((password || attempted) && validation.password) || serverErrors.password;
  const passwordStatus = !password ? "idle" : passwordError ? "error" : "success";
  const confirmPasswordError = (confirmPassword || attempted) ? validation.confirmPassword : "";
  const confirmPasswordStatus = !confirmPassword
    ? "idle"
    : confirmPasswordError || passwordStatus !== "success"
      ? "error"
      : "success";

  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const clearServerError = (field) => {
    setServerErrors((current) => ({ ...current, [field]: "" }));
    setErrorMessage("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setAttempted(true);
    if (Object.values(validation).some(Boolean) || usernameAvailability.error || emailAvailability.error) {
      setErrorMessage("Por favor, corrige los errores del formulario antes de continuar.");
      return;
    }
    if (isChecking) return;

    setErrorMessage("");
    setSubmitting(true);

    try {
      await apiJson("/api/users/register", {
        method: "POST",
        body,
      });

      navigate("/login");
    } catch (err) {
      setServerErrors(err.fields || {});
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = !!usernameError || !!emailError || !!passwordError || !!confirmPasswordError || !!firstNameError || !!lastNameError;
  const isChecking = usernameStatus === "checking" || emailStatus === "checking";

  return (
    <div className="min-h-screen text-slate-100">
      <div className="section-shell grid min-h-screen items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-10">
        <section className="order-2 space-y-8 lg:order-1">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Nuevo usuario</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Crear cuenta</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Registra tu acceso para empezar a centralizar tus vehículos, repostajes y gastos en un entorno profesional.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleRegister}
          noValidate
          className="order-1 glass-panel w-full rounded-[2rem] p-6 shadow-2xl shadow-black/25 sm:p-8 lg:order-2"
        >
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Registro</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Crea tu cuenta</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Accede al sistema Fuelytics con un único usuario y empieza a registrar tu información.
          </p>

          {errorMessage ? (
            <div role="alert" className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          <fieldset disabled={submitting} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Nombre de usuario</span>
              <div className="relative">
                <input
                  className={`w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${usernameError
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"
                    }`}
                  placeholder="Tu nombre de usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  minLength={REGISTRATION_LIMITS.usernameMin}
                  maxLength={REGISTRATION_LIMITS.usernameMax}
                  aria-invalid={!!usernameError}
                  aria-describedby="register-username-feedback"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearServerError("username");
                  }}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {usernameStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
                  {usernameStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {usernameStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              <span id="register-username-feedback" aria-live="polite" className={`mt-2 block text-sm ${usernameError ? "text-rose-400" : "text-slate-400"}`}>
                {usernameError || usernameAvailability.warning || "Entre 3 y 15 caracteres: letras sin tildes, números, puntos, guiones y guiones bajos."}
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</span>
              <div className="relative">
                <input
                  className={`w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${emailError
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"
                    }`}
                  placeholder="tu@email.com"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={REGISTRATION_LIMITS.emailMax}
                  aria-invalid={!!emailError}
                  aria-describedby="register-email-feedback"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearServerError("email");
                  }}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {emailStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
                  {emailStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {emailStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              <span id="register-email-feedback" aria-live="polite" className={`mt-2 block text-sm ${emailError ? "text-rose-400" : "text-slate-400"}`}>
                {emailError || emailAvailability.warning}
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Nombre (opcional)</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Tu nombre"
                autoComplete="given-name"
                maxLength={REGISTRATION_LIMITS.nameMax}
                aria-invalid={!!firstNameError}
                aria-describedby="register-first-name-feedback"
                onChange={(e) => { setFirstName(e.target.value); clearServerError("firstName"); }}
                value={firstName}
              />
              {firstNameError && <span id="register-first-name-feedback" className="mt-2 block text-sm text-rose-400">{firstNameError}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Apellido (opcional)</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Tu apellido"
                autoComplete="family-name"
                maxLength={REGISTRATION_LIMITS.nameMax}
                aria-invalid={!!lastNameError}
                aria-describedby="register-last-name-feedback"
                onChange={(e) => { setLastName(e.target.value); clearServerError("lastName"); }}
                value={lastName}
              />
              {lastNameError && <span id="register-last-name-feedback" className="mt-2 block text-sm text-rose-400">{lastNameError}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
              <div className="relative">
                <input
                  type="password"
                  className={`w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${passwordError
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"
                    }`}
                  placeholder="Define tu contraseña"
                  autoComplete="new-password"
                  minLength={REGISTRATION_LIMITS.passwordMin}
                  maxLength={REGISTRATION_LIMITS.passwordMax}
                  aria-invalid={!!passwordError}
                  aria-describedby="register-password-feedback"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearServerError("password"); }}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {passwordStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {passwordStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              <span id="register-password-feedback" aria-live="polite" className={`mt-2 block text-sm ${passwordError ? "text-rose-400" : "text-slate-400"}`}>
                {passwordError || "Entre 8 y 72 caracteres. Los caracteres especiales pueden reducir el máximo permitido."}
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Confirmar contraseña</span>
              <div className="relative">
                <input
                  type="password"
                  className={`w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${confirmPasswordError
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"
                    }`}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  maxLength={REGISTRATION_LIMITS.passwordMax}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby="register-confirm-password-feedback"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {confirmPasswordStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {confirmPasswordStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              {confirmPasswordError && <span id="register-confirm-password-feedback" aria-live="polite" className="mt-2 block text-sm text-rose-400">{confirmPasswordError}</span>}
            </label>
          </fieldset>

          <button
            disabled={submitting || hasErrors || isChecking}
            className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="mt-5 text-sm text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-white transition hover:text-teal-200">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
