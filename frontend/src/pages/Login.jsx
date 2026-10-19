import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiJson } from "../services/api";
import GoogleSignInPanel from "../components/GoogleSignInPanel";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleRegistration, setGoogleRegistration] = useState(false);
  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const data = await apiJson("/api/users/login", {
        method: "POST",
        body: { email, password },
      });

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
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <div className="section-shell grid min-h-screen items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
        <section className="space-y-8 pr-0 lg:pr-8">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Acceso</p>

          <div className="space-y-5">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Accede a tu cuenta y continúa con la gestión de tus vehículos.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              Todo el contenido importante queda organizado en una experiencia limpia y directa.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Rápido", "Acceso inmediato a tu panel"],
              ["Claro", "Interfaz pensada para trabajar"],
              ["Seguro", "Tus datos protegidos con cifrado"],
            ].map(([title, description]) => (
              <div key={title} className="glass-panel rounded-2xl p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200/80">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="glass-panel w-full rounded-[2rem] p-6 shadow-2xl shadow-black/25 sm:p-8"
        >
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Bienvenido</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Iniciar sesión</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Elige cómo quieres acceder a tu cuenta de Fuelytics.</p>
          <form onSubmit={handleLogin} hidden={googleRegistration}>
          {location.state?.accountDeleted ? (
            <p role="status" className="mb-4 rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-3 text-sm text-teal-100">Tu cuenta y sus datos se han eliminado correctamente.</p>
          ) : null}
          {errorMessage ? (
            <div role="alert" className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/8 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="tu@email.com"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Tu contraseña"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <button disabled={submitting} className="mx-auto mt-6 block min-h-11 w-full max-w-[400px] rounded-full bg-teal-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60">
            {submitting ? "Entrando…" : "Entrar en el panel"}
          </button>

          </form>
          <GoogleSignInPanel onRegistrationChange={setGoogleRegistration} />
          <p hidden={googleRegistration} className="mt-5 text-sm text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-medium text-white transition hover:text-teal-200">
              Regístrate ahora
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
