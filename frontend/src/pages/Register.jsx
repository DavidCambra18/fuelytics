import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Check, X } from "lucide-react";
import { apiFetch, apiJson } from "../services/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("idle");

  const [passwordError, setPasswordError] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("idle");

  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState("idle");

  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const val = username.trim();
    if (!val) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await apiFetch(`/api/users/check-username?username=${encodeURIComponent(val)}`);
        if (!res.ok) {
          setUsernameError("Este nombre de usuario ya está en uso");
          setUsernameStatus("error");
        } else {
          setUsernameError("");
          setUsernameStatus("success");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    const val = email.trim();
    if (!val || !val.includes("@")) {
      setEmailStatus("idle");
      setEmailError("");
      return;
    }

    const timer = setTimeout(async () => {
      setEmailStatus("checking");
      try {
        const res = await apiFetch(`/api/users/check-email?email=${encodeURIComponent(val)}`);
        if (!res.ok) {
          setEmailError("Este correo electrónico ya está registrado");
          setEmailStatus("error");
        } else {
          setEmailError("");
          setEmailStatus("success");
        }
      } catch {
        setEmailStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!password) {
      setPasswordStatus("idle");
      setPasswordError("");
      return;
    }

    if (password.length < 6) {
      setPasswordStatus("error");
      setPasswordError("Debe tener al menos 6 caracteres");
    } else {
      setPasswordStatus("success");
      setPasswordError("");
    }
  }, [password]);

  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordStatus("idle");
      setConfirmPasswordError("");
      return;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordStatus("error");
      setConfirmPasswordError("Las contraseñas no coinciden");
    } else if (passwordStatus === "success") {
      setConfirmPasswordStatus("success");
      setConfirmPasswordError("");
    }
  }, [confirmPassword, password, passwordStatus]);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setErrorMessage("Por favor, corrige los errores del formulario antes de continuar.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      const body = { username, email, password };
      if (firstName?.trim()) body.firstName = firstName.trim();
      if (lastName?.trim()) body.lastName = lastName.trim();

      await apiJson("/api/users/register", {
        method: "POST",
        body,
      });

      navigate("/login");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = !!usernameError || !!emailError || !!passwordError || !!confirmPasswordError;
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
          className="order-1 glass-panel w-full rounded-[2rem] p-6 shadow-2xl shadow-black/25 sm:p-8 lg:order-2"
        >
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Registro</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Crea tu cuenta</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Accede al sistema Fuelytics con un único usuario y empieza a registrar tu información.
          </p>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Nombre de usuario</span>
              <div className="relative">
                <input
                  className={`w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${usernameError
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"
                    }`}
                  placeholder="Tu nombre de usuario"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameStatus("idle");
                    setUsernameError("");
                  }}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {usernameStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
                  {usernameStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {usernameStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              {usernameError && <span className="mt-2 block text-sm text-rose-400">{usernameError}</span>}
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
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailStatus("idle");
                    setEmailError("");
                  }}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {emailStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
                  {emailStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {emailStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              {emailError && <span className="mt-2 block text-sm text-rose-400">{emailError}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Nombre (opcional)</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Tu nombre"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Apellido (opcional)</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Tu apellido"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
              />
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
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {passwordStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {passwordStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              {passwordError && <span className="mt-2 block text-sm text-rose-400">{passwordError}</span>}
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
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                  {confirmPasswordStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                  {confirmPasswordStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              {confirmPasswordError && <span className="mt-2 block text-sm text-rose-400">{confirmPasswordError}</span>}
            </label>
          </div>

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