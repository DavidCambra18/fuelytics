import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        throw new Error("No se pudo crear la cuenta");
      }

      navigate("/login");
    } catch (registerError) {
      setErrorMessage(registerError.message || "No se pudo crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  };

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
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Tu nombre de usuario"
                required
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="tu@email.com"
                type="email"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Define tu contraseña"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Confirmar contraseña</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                placeholder="Repite tu contraseña"
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          </div>

          <button
            disabled={submitting}
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