import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-4 text-white backdrop-blur">
      <Link to="/" className="font-semibold tracking-wide text-white">
        Fuelytics
      </Link>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link to="/gas-stations" className="rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-2 text-teal-100 transition hover:bg-teal-300/20">
          Gasolineras
        </Link>
        <Link to="/login" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:bg-white/10">
          Login
        </Link>
      </div>
    </nav>
  );
}