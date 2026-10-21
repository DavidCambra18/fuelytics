import { useEffect, useRef } from "react";

export default function FormErrorSummary({ message, fields, prefix }) {
  const summaryRef = useRef(null);

  useEffect(() => {
    if (message) summaryRef.current?.focus();
  }, [message, fields]);

  if (!message) return null;

  return (
    <div ref={summaryRef} role="alert" tabIndex={-1} className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300">
      <p className="font-semibold">{message}</p>
      {Object.keys(fields).length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {Object.entries(fields).map(([field, description]) => (
            <li key={field} id={`${prefix}-${field}-error`}>
              <a href={`#${prefix}-${field}`} className="underline underline-offset-2" onClick={(event) => {
                const input = document.getElementById(`${prefix}-${field}`);
                event.preventDefault();
                input?.focus();
              }}>{description}</a>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1">Tus datos siguen en el formulario. Puedes revisarlos y volver a intentarlo.</p>}
    </div>
  );
}
