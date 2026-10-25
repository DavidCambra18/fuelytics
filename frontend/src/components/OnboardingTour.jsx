import { useId, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { useAuth } from "../context/auth";
import useDialogAccessibility from "../hooks/useDialogAccessibility";
import { getTourStatus, placeTourPanel, setTourStatus } from "../utils/onboarding";
import ViewportPortal from "./ViewportPortal";
import { Button } from "./ui/button";
import { Surface } from "./ui/surface";

const STEPS = [
  { title: "Bienvenido a Fuelytics", description: "Tu vehículo, sus gastos y sus próximos cuidados, en un mismo lugar. Te enseñamos dónde está lo esencial para que puedas empezar a tu ritmo." },
  { title: "Todo empieza en tu garaje", targets: ["create-vehicle", "garage"], description: "Desde aquí añades tus vehículos. Al abrir uno encontrarás sus repostajes, gastos, recordatorios, neumáticos y estadísticas. Cada vehículo conserva su propio historial." },
  { title: "Encuentra dónde repostar", targets: ["gas-stations"], description: "En Gasolineras puedes explorar el mapa y comparar precios por combustible. Mueve el mapa y busca en la zona que te interese; también puedes usar tu ubicación si decides permitirla." },
  { title: "Comparte solo lo que tú decidas", targets: ["friends"], description: "En Amigos buscas personas y gestionas las solicitudes. En Clasificación comparas consumos; en móvil está dentro de Más. La información compartida depende de tus opciones de privacidad." },
  { title: "Calcula el coste de un viaje", targets: ["calculator", "mobile-more"], description: "La Calculadora te permite introducir distancia, consumo y precio del combustible para estimar un viaje. En móvil la encontrarás en Más. Tú eliges los valores del cálculo." },
  { title: "Tu perfil y tus preferencias", targets: ["account", "mobile-more"], description: "Abre tu menú de usuario para acceder a Mi perfil y Ajustes, cambiar tus datos o revisar la privacidad. En móvil se encuentran en Más. Aquí también podrás repetir este recorrido cuando quieras." },
  { title: "Ya puedes empezar", description: "Crea tu primer vehículo y añade un repostaje o un gasto cuando lo necesites. También puedes explorar la aplicación primero: no hace falta completar todo ahora." },
];

export default function OnboardingTour() {
  const { username } = useAuth();
  const location = useLocation();
  const requested = location.pathname === "/dashboard" && new URLSearchParams(location.search).get("tour") === "1";
  // A replay is a fresh session, including when the app shell remains mounted.
  return username ? <TourSession key={`${username}:${requested ? location.key : "automatic"}`} username={username} requested={requested} /> : null;
}

function TourSession({ username, requested }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => location.pathname === "/dashboard" && (requested || getTourStatus(username) === "pending"));
  const [step, setStep] = useState(0);
  const [layout, setLayout] = useState(null);
  const headingRef = useRef(null);
  const resultRef = useRef({ status: "skipped", destination: null });
  const maskId = useId();
  const visible = open && location.pathname === "/dashboard";
  const { dialogRef, titleId, close, isClosing } = useDialogAccessibility(visible, () => {
    setTourStatus(username, resultRef.current.status);
    setOpen(false);
    if (resultRef.current.destination) navigate(resultRef.current.destination);
    else if (requested) {
      const params = new URLSearchParams(location.search);
      params.delete("tour");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
    if (!resultRef.current.destination) window.requestAnimationFrame(() => {
      if (window.location.pathname !== "/dashboard" || document.querySelector('[role="dialog"]')) return;
      if (document.activeElement === document.body) {
        (document.querySelector('[data-tour="create-vehicle"]') || document.getElementById("app-content"))?.focus({ preventScroll: true });
      }
    });
  });

  useLayoutEffect(() => {
    if (!visible) return;
    const measure = () => {
      const panel = dialogRef.current;
      if (!panel) return;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      let rect = null;
      for (const target of STEPS[step].targets || []) {
        const element = [...document.querySelectorAll(`[data-tour="${target}"]`)].find((candidate) => {
          const bounds = candidate.getBoundingClientRect();
          return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < viewport.height && bounds.right > 0 && bounds.left < viewport.width && getComputedStyle(candidate).visibility !== "hidden";
        });
        if (!element) continue;
        const bounds = element.getBoundingClientRect();
        rect = { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height };
        break;
      }
      const next = { rect, position: placeTourPanel(rect, { height: panel.offsetHeight }, viewport) };
      setLayout((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (dialogRef.current) observer?.observe(dialogRef.current);
    const app = document.querySelector(".app-shell");
    if (app) observer?.observe(app);
    const content = new MutationObserver(measure);
    if (app) content.observe(app, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    headingRef.current?.focus({ preventScroll: true });
    return () => {
      observer?.disconnect();
      content.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [visible, step, dialogRef]);

  if (!visible) return null;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const finish = (status, destination = null) => {
    if (isClosing()) return;
    resultRef.current = { status, destination };
    close();
  };
  const changeStep = (next) => { if (!isClosing()) setStep(next); };
  const rect = layout?.rect;
  return <ViewportPortal>
    <div className="fl-tour-root">
      <svg className="fl-tour-shade" aria-hidden="true">
        <defs><mask id={maskId}><rect width="100%" height="100%" fill="white" />{rect ? <rect x={Math.max(0, rect.left - 5)} y={Math.max(0, rect.top - 5)} width={rect.width + 10} height={rect.height + 10} rx="12" fill="black" /> : null}</mask></defs>
        <rect width="100%" height="100%" fill="rgba(3, 10, 18, 0.78)" mask={`url(#${maskId})`} />
      </svg>
      {rect ? <div className="fl-tour-highlight" aria-hidden="true" style={{ left: rect.left - 5, top: rect.top - 5, width: rect.width + 10, height: rect.height + 10 }} /> : null}
      <Surface ref={dialogRef} variant="floating" className="fl-tour-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={`${titleId}-description`} tabIndex={-1} style={layout ? layout.position : undefined}>
        <header className="fl-tour-header">
          <span className="fl-tour-progress"><Compass aria-hidden="true" size={18} />Recorrido · {step + 1} de {STEPS.length}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Omitir recorrido" onClick={() => finish("skipped")}><X aria-hidden="true" /></Button>
        </header>
        <progress className="fl-tour-progress-bar" value={step + 1} max={STEPS.length} aria-label="Progreso del recorrido" />
        <div className="fl-tour-body">
          <h2 ref={headingRef} id={titleId} className="fl-section-title" tabIndex={-1}>{current.title}</h2>
          <p id={`${titleId}-description`} className="fl-supporting mt-3">{current.description}</p>
          {last ? <Button variant="outline" className="mt-5 w-full" onClick={() => finish("completed", "/vehicles/new")}>Crear un vehículo</Button> : null}
        </div>
        <footer className="fl-tour-footer">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft aria-hidden="true" />Anterior</Button>
          <Button type="button" onClick={() => last ? finish("completed") : changeStep(step + 1)}>{last ? "Terminar" : step === 0 ? "Empezar" : "Siguiente"}{!last ? <ArrowRight aria-hidden="true" /> : null}</Button>
        </footer>
        {!last ? <Button variant="link" className="fl-tour-skip" onClick={() => finish("skipped")}>Prefiero explorar por mi cuenta</Button> : null}
      </Surface>
    </div>
  </ViewportPortal>;
}
