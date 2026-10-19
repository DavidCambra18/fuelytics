import { useEffect, useRef, useState } from "react";
import { apiJson } from "../services/api";

let scriptPromise;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timeout = window.setTimeout(() => { script.remove(); reject(new Error("Google tarda en responder. Vuelve a intentarlo.")); }, 15000);
      script.onload = () => {
        window.clearTimeout(timeout);
        if (window.google?.accounts?.id) resolve(window.google.accounts.id);
        else reject(new Error("No se pudo cargar el acceso con Google"));
      };
      script.onerror = () => { window.clearTimeout(timeout); script.remove(); reject(new Error("No se pudo conectar con Google. Comprueba tu conexión o los bloqueadores del navegador.")); };
      document.head.appendChild(script);
    }).catch((error) => { scriptPromise = undefined; throw error; });
  }
  return scriptPromise;
}

// Mount only one active Google widget per page: GIS shares its configuration globally.
export default function GoogleIdentityButton({ purpose = "LOGIN", onVerified, separator = false }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onVerified);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ enabled: false, loading: true, busy: false, error: "" });
  useEffect(() => { callbackRef.current = onVerified; }, [onVerified]);

  useEffect(() => {
    let active = true;
    let used = false;
    let expiration;
    let observer;
    const controller = new AbortController();
    const container = containerRef.current;
    async function prepare() {
      try {
        const config = await apiJson("/api/auth/google/config", { signal: controller.signal });
        if (!active || !config.enabled) return;
        setState({ enabled: true, loading: true, busy: false, error: "" });
        const challenge = await apiJson("/api/auth/google/challenge", { method: "POST", body: { purpose }, signal: controller.signal });
        const google = await loadGoogle();
        if (!active) return;
        google.initialize({
          client_id: config.clientId, nonce: challenge.nonce, auto_select: false, ux_mode: "popup",
          callback: async ({ credential }) => {
            if (!active || used) return;
            used = true;
            window.clearTimeout(expiration);
            setState({ enabled: true, loading: false, busy: true, error: "" });
            try {
              await callbackRef.current({ credential, challengeId: challenge.challengeId });
            } catch (error) {
              if (active) setState({ enabled: true, loading: false, busy: false, error: error.message || "No se pudo continuar con Google" });
            }
          },
        });
        let renderedWidth = 0;
        const render = () => {
          if (!active || used || !container) return;
          const width = Math.min(400, Math.max(200, Math.floor(container.clientWidth)));
          if (renderedWidth === width && container.hasChildNodes()) return;
          renderedWidth = width;
          container.replaceChildren();
          google.renderButton(container, { theme: "outline", size: "large", text: "continue_with", shape: "pill", locale: "es", width });
        };
        render();
        observer = new ResizeObserver(render);
        if (container) observer.observe(container);
        setState({ enabled: true, loading: false, busy: false, error: "" });
        expiration = window.setTimeout(() => {
          used = true;
          if (active) setState({ enabled: true, loading: false, busy: false, error: "La confirmación ha caducado. Vuelve a preparar el acceso con Google." });
        }, 285000);
      } catch (error) {
        if (active && error.name !== "AbortError") setState({ enabled: true, loading: false, busy: false, error: error.message });
      }
    }
    prepare();
    return () => {
      active = false;
      controller.abort();
      observer?.disconnect();
      window.clearTimeout(expiration);
      container?.replaceChildren();
    };
  }, [purpose, attempt]);

  return (
    <div className={state.enabled ? "my-5 space-y-3" : "hidden"}>
      {separator ? <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-white/10" />o continúa con Google<span className="h-px flex-1 bg-white/10" /></div> : null}
      {/* Google's light button needs a light color scheme for its iframe to stay transparent. */}
      <div ref={containerRef} style={{ colorScheme: "light" }} className={state.loading || state.busy || state.error ? "hidden" : "mx-auto flex min-h-11 w-full max-w-[400px] items-center justify-center"} />
      {state.loading || state.busy ? <p role="status" className="text-center text-sm text-slate-400">{state.busy ? "Verificando tu cuenta…" : "Preparando Google…"}</p> : null}
      {state.error ? <div role="alert" className="space-y-2 text-sm text-rose-300"><p>{state.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="min-h-11 rounded-xl border border-white/10 px-4 text-slate-200">Volver a intentar con Google</button></div> : null}
    </div>
  );
}
