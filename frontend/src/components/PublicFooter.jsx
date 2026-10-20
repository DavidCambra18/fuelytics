import ProjectLinks from "./ProjectLinks";

export default function PublicFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-white/[0.06]">
      <div className="section-shell flex flex-col items-center justify-between gap-1 py-3 sm:flex-row sm:gap-4">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Fuelytics</p>
        <nav aria-label="Enlaces del proyecto" className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5">
          <ProjectLinks footer />
        </nav>
      </div>
    </footer>
  );
}
