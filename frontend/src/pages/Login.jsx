import useActionGuard from "../hooks/useActionGuard";
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import GoogleSignInPanel from "../components/GoogleSignInPanel";
import AuthLayout from "../components/AuthLayout";
import { Input } from "../components/ui/field";
import { Button } from "../components/ui/button";

export default function Login() {
  const { guard, isActive } = useActionGuard();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleRegistration, setGoogleRegistration] = useState(false);
  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = guard(async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const data = await apiJson("/api/users/login", {
        method: "POST",
        body: { email, password },
      });

      if (!isActive()) return;
      if (!data.token) {
        throw new Error("El servidor no devolvió una sesión válida");
      }

      try {
        localStorage.setItem("fuelytics:sidebar-mode", "collapsed");
      } catch {
        // A browser preference must not prevent signing in.
      }
      setAuth({ token: data.token, username: data.username });
      navigate("/dashboard");

    } catch (err) {
      if (!isActive()) return;
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title="Iniciar sesión" description="Elige cómo quieres acceder a tu cuenta de Fuelytics." introduction="Accede a tu cuenta y continúa con la gestión de tus vehículos." details="Todo el contenido importante queda organizado en una experiencia limpia y directa." benefits>
          <form onSubmit={handleLogin} hidden={googleRegistration} aria-busy={submitting} aria-describedby={errorMessage ? "login-error" : undefined} className="mt-6">
          {location.state?.accountDeleted ? (
            <p role="status" className="mb-4 rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-3 text-sm text-teal-100">Tu cuenta y sus datos se han eliminado correctamente.</p>
          ) : null}
          {errorMessage ? (
            <div id="login-error" role="alert" className="fl-feedback-error">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</span>
              <Input
                placeholder="tu@email.com"
                type="email" autoComplete="email" name="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
              <Input
                name="password" type="password" autoComplete="current-password"
                placeholder="Tu contraseña"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <Button pending={submitting} pendingLabel="Entrando…" disabled={submitting} className="mx-auto mt-6 flex w-full max-w-[400px]" type="submit">
            Entrar en el panel
          </Button>

          </form>
          <GoogleSignInPanel onRegistrationChange={setGoogleRegistration} />
          <p hidden={googleRegistration} className="mt-5 text-sm text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-medium text-white transition hover:text-teal-200">
              Regístrate ahora
            </Link>
          </p>
    </AuthLayout>
  );
}
