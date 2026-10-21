import { cn } from "@/lib/utils";

export function Field({ id, label, children, className }) {
  return (
    <div className={cn("fl-field-group", className)}>
      <label htmlFor={id} className="fl-label">{label}</label>
      {children}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn("fl-field", className)} {...props} />;
}
