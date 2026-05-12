import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setAuth } = useAuth();

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    const res = await fetch("http://localhost:8080/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    try {
      const data = await res.json().catch(() => ({}));

      // For both incorrect password and user-not-found, show the same message.
      if (!res.ok || data.error) {
        setErrorMessage("Correo o contraseña incorrectos");
        return;
      }

      // Successful login — set auth and go to dashboard
      setAuth({ token: data.token, username: data.username });
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage("No se pudo conectar con el servidor.");
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
              Accede a tu cuenta y continúa con la gestión de tu flota.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              Todo el contenido importante queda organizado en una experiencia limpia y directa.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Rápido", "Acceso inmediato a tu panel"],
              ["Claro", "Interfaz pensada para trabajar"],
              ["Sólido", "Diseño preparado para crecer"],
            ].map(([title, description]) => (
              <div key={title} className="glass-panel rounded-2xl p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200/80">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={handleLogin}
          className="glass-panel w-full rounded-[2rem] p-6 shadow-2xl shadow-black/25 sm:p-8"
        >
          {errorMessage ? (
            <div role="alert" className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/8 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Bienvenido</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Iniciar sesión</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Usa tu correo y contraseña para acceder al dashboard personal.
          </p>

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

          <button disabled={submitting} className="mt-6 w-full rounded-2xl bg-teal-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60">
            {submitting ? "Entrando…" : "Entrar en el panel"}
          </button>

          <p className="mt-5 text-sm text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-medium text-white transition hover:text-teal-200">
              Regístrate ahora
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}