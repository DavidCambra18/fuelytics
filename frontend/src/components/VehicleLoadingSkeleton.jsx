import { Surface } from "./ui/surface";

export default function VehicleLoadingSkeleton() {
  return (
    <Surface as="section" role="status" aria-label="Cargando información del vehículo" className="fl-workspace">
      <span className="sr-only">Cargando información del vehículo…</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="mb-8 h-6 w-56 max-w-full rounded-lg bg-secondary" />
        <div className="fl-vehicle-facts">
          {[4, 3, 3].map((rows, group) => (
            <div key={group}>
              <div className="mb-5 h-4 w-32 rounded bg-secondary" />
              {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex justify-between gap-4 py-3">
                  <div className="h-4 w-24 rounded bg-secondary" />
                  <div className="h-4 w-16 rounded bg-secondary" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Surface>
  );
}
