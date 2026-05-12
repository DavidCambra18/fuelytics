import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen text-slate-100">
      <header className="section-shell flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Fuelytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link to="/login" className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
            Iniciar sesión
          </Link>
          <Link to="/register" className="rounded-full bg-teal-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-300">
            Crear cuenta
          </Link>
        </div>
      </header>

      <main className="section-shell pb-16 pt-10 lg:pb-20 lg:pt-16">
        <div className="hero-grid items-center">
          <section className="hero-copy space-y-8">

            <div className="space-y-5">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Centraliza vehículos, repostajes y gastos en un solo lugar.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Una herramienta diseñada para gestionar la información necesaria de tu vehículo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">
                Empezar ahora
              </Link>
              <Link to="/login" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">
                Acceder al dashboard
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Vehículos", "Inventario y seguimiento de cada coche"],
                ["Control", "Repostajes y costes en un mismo flujo"],
                ["Visión", "Preparado para estadísticas y evolución"],
              ].map(([title, description]) => (
                <div key={title} className="glass-panel rounded-2xl p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200/80">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}