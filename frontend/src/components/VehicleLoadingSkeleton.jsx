export default function VehicleLoadingSkeleton() {
  return (
    <section role="status" aria-label="Cargando información del vehículo" className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <span className="sr-only">Cargando información del vehículo…</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-4 w-24 rounded-full bg-teal-300/15" />
          <div className="flex gap-3">
            <div className="h-10 w-24 rounded-full bg-white/5" />
            <div className="h-10 w-24 rounded-full bg-white/5" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-teal-300/10 bg-gradient-to-br from-teal-300/5 via-slate-900/40 to-slate-950/40 p-5">
              <div className="h-3 w-24 rounded-full bg-teal-300/10" />
              <div className={`mt-3 h-7 rounded-lg bg-white/5 ${index % 3 === 0 ? "w-3/4" : "w-1/2"}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
