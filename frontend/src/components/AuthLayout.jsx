import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PublicFooter from "./PublicFooter";
import { Surface } from "./ui/surface";
import { Button } from "./ui/button";

export default function AuthLayout({ title, description, children, introduction, details, benefits = false }) {
  return (
    <div className="fl-public-shell">
      <header className="section-shell fl-public-header">
        <Link to="/" className="fl-wordmark" aria-label="Fuelytics · Inicio">Fuelytics<span aria-hidden="true">.</span></Link>
        <Button asChild variant="ghost"><Link to="/"><ArrowLeft aria-hidden="true" />Inicio</Link></Button>
      </header>
      <main className="section-shell fl-auth-layout">
        <section className="fl-auth-introduction">
          <h1>{introduction}</h1>
          <p className="fl-auth-description">{details}</p>
          {benefits ? <dl className="fl-auth-benefits">
            {[["Rápido", "Acceso inmediato a tu panel"], ["Claro", "Interfaz pensada para trabajar"], ["Seguro", "Tus datos protegidos con cifrado"]].map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}
          </dl> : null}
        </section>
        <Surface as="section" className="fl-auth-panel" aria-label={title}>
          <h2 className="fl-page-title">{title}</h2>
          {description ? <p className="fl-supporting mt-3">{description}</p> : null}
          {children}
        </Surface>
      </main>
      <PublicFooter />
    </div>
  );
}
