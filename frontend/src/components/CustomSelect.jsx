import { useEffect, useRef, useState } from "react";

export default function CustomSelect({ options, value, onChange, placeholder, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = options.find((o) => o.value === value) || null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={[
          "w-full text-left rounded-2xl bg-slate-950/60 px-4 py-2.5 pr-10 text-white outline-none transition",
          error ? "border border-rose-400 ring-1 ring-rose-400/25" : "border border-white/10 hover:border-teal-300/40",
        ].join(" ")}
      >
        <span className="block truncate">{current ? current.label : placeholder}</span>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-white/6 bg-slate-900/95 p-1 text-sm shadow-2xl">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="cursor-pointer rounded-md px-3 py-2 text-slate-200 hover:bg-slate-800/60"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
