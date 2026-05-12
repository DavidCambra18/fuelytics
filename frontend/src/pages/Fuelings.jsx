import { Link, useOutletContext } from "react-router-dom";

export default function Fuelings() {
  const { selectedVehicle } = useOutletContext();

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Repostajes</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Consumos de {selectedVehicle.brand} {selectedVehicle.model}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Aquí se concentrará el historial de repostajes, litros, importe y coste por kilómetro de este vehículo.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Litros por repostaje", "Registro detallado por vehículo"],
            ["Coste por km", "Seguimiento de eficiencia real"],
            ["Historial", "Listado cronológico de llenados"],
          ].map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
