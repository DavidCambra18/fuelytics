import { useId } from "react";

export default function CustomSelect({ options, value, onChange, placeholder = "Selecciona una opción", error = false, disabled = false, id, appearance = "default", ...props }) {
  const generatedId = useId();
  const hasEmptyOption = options.some((option) => String(option.value) === "");

  return (
    <span className="relative block min-w-0 w-full">
      <select
        {...props}
        id={id || generatedId}
        value={value ?? ""}
        disabled={disabled}
        aria-invalid={error || props["aria-invalid"] || undefined}
        onChange={(event) => {
          // Preserve numeric values, such as tire IDs, for existing callers.
          const option = options.find((item) => String(item.value) === event.target.value);
          onChange(option ? option.value : event.target.value);
        }}
        className={[
          ...(appearance === "atlantic"
            ? ["fl-field appearance-none pr-10"]
            : [
              "min-h-11 w-full min-w-0 appearance-none rounded-2xl border bg-slate-950/60 py-2.5 pl-4 pr-10 text-sm font-medium text-white outline-none transition-colors",
              "focus-visible:border-teal-300 focus-visible:ring-2 focus-visible:ring-teal-300/20 [&_option]:bg-slate-900 [&_option]:text-white",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-teal-300/40",
              error ? "border-rose-400 ring-1 ring-rose-400/25" : "border-white/10",
            ]),
        ].join(" ")}
      >
        {!hasEmptyOption ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
