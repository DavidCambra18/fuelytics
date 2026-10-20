import { Link } from "react-router-dom";
import PublicFooter from "../components/PublicFooter";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col text-slate-100">
      <header className="section-shell flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Fuelytics</p>
          </div>
        </div>

        <nav className="grid w-full grid-cols-2 gap-2 text-sm sm:flex sm:w-auto sm:items-center sm:gap-3">
          <Link to="/gas-stations" className="col-span-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-center text-white transition hover:bg-white/10 sm:col-span-1 sm:py-3">
            Ver gasolineras
          </Link>
          <Link to="/login" className="rounded-full px-3 py-2.5 text-center text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:py-2">
            Iniciar sesión
          </Link>
          <Link to="/register" className="rounded-full bg-teal-400 px-3 py-2.5 text-center font-semibold text-slate-950 transition hover:bg-teal-300 sm:px-5">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main className="section-shell flex-1 pb-12 pt-6 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-16">
        <div className="hero-grid items-center">
          <section className="hero-copy space-y-7 sm:space-y-8">

            <div className="space-y-5">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Centraliza vehículos, repostajes y gastos en un solo lugar.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Una herramienta diseñada para gestionar la información necesaria de tu vehículo.
              </p>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link to="/register" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-center font-medium text-white transition hover:bg-white/10">
                Empezar ahora
              </Link>
              <Link to="/login" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-center font-medium text-white transition hover:bg-white/10">
                Acceder al dashboard
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Vehículos", "Inventario y seguimiento de cada coche"],
                ["Control", "Repostajes y costes en un mismo flujo"],
                ["Visión", "Preparado para estadísticas, evolución y precios cercanos"],
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
      <PublicFooter />
    </div>
  );
}
