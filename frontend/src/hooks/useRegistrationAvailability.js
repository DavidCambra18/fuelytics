import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function useRegistrationAvailability(field, value, validationError) {
  const [result, setResult] = useState({ value: "", status: "idle", error: "", warning: "" });

  useEffect(() => {
    if (!value || validationError) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/users/check-${field}?${field}=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 409) {
          setResult({ value, status: "error", warning: "", error: field === "username" ? "Este nombre de usuario ya está en uso" : "Este correo electrónico ya está registrado" });
        } else if (response.ok) {
          setResult({ value, status: "success", error: "", warning: "" });
        } else {
          throw new Error("Availability unavailable");
        }
      } catch {
        if (!controller.signal.aborted) {
          // A failed preflight is not proof that an address or username is taken.
          setResult({ value, status: "unavailable", error: "", warning: "No se pudo comprobar la disponibilidad. Se verificará al crear la cuenta." });
        }
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [field, value, validationError]);

  if (!value || validationError) return { status: "idle", error: "", warning: "" };
  if (result.value !== value) return { status: "checking", error: "", warning: "" };
  return result;
}
