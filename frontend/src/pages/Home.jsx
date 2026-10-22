import { Link } from "react-router-dom";
import { ArrowRight, CarFront, Fuel, ChartNoAxesCombined } from "lucide-react";
import PublicFooter from "../components/PublicFooter";
import { Button } from "../components/ui/button";
import { Surface } from "../components/ui/surface";

export default function Home() {
  return (
    <div className="fl-public-shell">
      <header className="section-shell fl-public-header">
        <Link to="/" className="fl-wordmark" aria-label="Fuelytics · Inicio">Fuelytics<span aria-hidden="true">.</span></Link>
        <nav aria-label="Navegación principal" className="fl-home-navigation">
          <Button asChild variant="outline" className="fl-home-stations"><Link to="/gas-stations"><Fuel aria-hidden="true" />Ver gasolineras</Link></Button>
          <Button asChild variant="ghost"><Link to="/login">Iniciar sesión</Link></Button>
          <Button asChild><Link to="/register">Crear cuenta</Link></Button>
        </nav>
      </header>
      <main className="section-shell fl-home-layout">
        <section className="fl-home-copy">
          <h1>Centraliza vehículos, repostajes y gastos <span>en un solo lugar.</span></h1>
          <p>Una herramienta diseñada para gestionar la información necesaria de tu vehículo.</p>
          <div className="fl-home-actions">
            <Button asChild size="lg"><Link to="/register">Empezar ahora<ArrowRight aria-hidden="true" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Acceder al dashboard</Link></Button>
          </div>
        </section>
        <Surface as="section" className="fl-home-product" aria-label="Qué puedes gestionar con Fuelytics">
          <h2>Tu vehículo, con perspectiva.</h2>
          <dl>
            {[
              [CarFront, "Vehículos", "Inventario y seguimiento de cada coche"],
              [Fuel, "Control", "Repostajes y costes en un mismo flujo"],
              [ChartNoAxesCombined, "Visión", "Preparado para estadísticas, evolución y precios cercanos"],
            ].map(([Icon, title, description]) => <div key={title} className="fl-home-feature">
              <dt><Icon aria-hidden="true" /><span>{title}</span></dt><dd>{description}</dd>
            </div>)}
          </dl>
        </Surface>
      </main>
      <PublicFooter />
    </div>
  );
}
