import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function useRegistrationAvailability(field, value, validationError, refreshKey = 0) {
  const [result, setResult] = useState({ value: "", status: "idle", error: "", warning: "" });

  useEffect(() => {
    if (!value || validationError) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/users/check-${field}?${field}=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 409) {
          setResult({ value, refreshKey, status: "error", warning: "", error: field === "username" ? "Este nombre de usuario ya está en uso" : "Este correo electrónico ya está registrado" });
        } else if (response.status === 400 && field === "username") {
          const payload = await response.json().catch(() => ({}));
          if (!controller.signal.aborted) setResult({ value, refreshKey, status: "error", warning: "", error: payload.message || "Este nombre de usuario no está permitido" });
        } else if (response.ok) {
          setResult({ value, refreshKey, status: "success", error: "", warning: "" });
        } else {
          throw new Error("Availability unavailable");
        }
      } catch {
        if (!controller.signal.aborted) {
          // A failed preflight is not proof that an address or username is taken.
          setResult({ value, refreshKey, status: "unavailable", error: "", warning: "No se pudo comprobar la disponibilidad. Se verificará al crear la cuenta." });
        }
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [field, value, validationError, refreshKey]);

  if (!value || validationError) return { status: "idle", error: "", warning: "" };
  if (result.value !== value || result.refreshKey !== refreshKey) return { status: "checking", error: "", warning: "" };
  return result;
}
