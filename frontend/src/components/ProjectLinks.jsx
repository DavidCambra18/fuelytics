import { Activity, CodeXml, ExternalLink } from "lucide-react";

const LINKS = [
  { href: "https://status.davidcambra.com/status/fuelytics", label: "Estado del servicio", icon: Activity },
  { href: "https://github.com/DavidCambra18/fuelytics", label: "GitHub", icon: CodeXml },
];

export default function ProjectLinks({ compact = false, footer = false, onNavigate }) {
  return LINKS.map(({ href, label, icon: Icon }) => (
    <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={onNavigate}
      title={compact ? `${label} (se abre en otra pestaña)` : undefined}
      className={footer
        ? "inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-slate-400 transition hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
        : `app-nav-link ${compact ? "justify-center" : ""}`}>
      <Icon className={`${footer ? "h-4 w-4" : "h-5 w-5"} shrink-0`} aria-hidden="true" />
      <span className={compact ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
      {!compact && !footer ? <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : null}
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  ));
}
