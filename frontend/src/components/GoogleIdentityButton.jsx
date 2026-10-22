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
  const [interacted, setInteracted] = useState(false);
  const [state, setState] = useState({ enabled: false, loading: true, busy: false, error: "" });
  useEffect(() => { callbackRef.current = onVerified; }, [onVerified]);

  useEffect(() => {
    let active = true;
    let used = false;
    let expiration;
    let observer;
    let renderTimeout;
    let resizeTimeout;
    const controller = new AbortController();
    const container = containerRef.current;
    const preparationTimeout = window.setTimeout(() => {
      controller.abort();
      if (active && !used) setState({ enabled: true, loading: false, busy: false, error: "El acceso con Google tarda en responder. Vuelve a intentarlo." });
    }, 20000);
    const revealButton = (event) => {
      if (!active || used || event.target.tagName !== "IFRAME") return;
      window.clearTimeout(renderTimeout);
      window.clearTimeout(preparationTimeout);
      setState({ enabled: true, loading: false, busy: false, error: "" });
    };
    container?.addEventListener("load", revealButton, true);
    async function prepare() {
      try {
        setState({ enabled: false, loading: true, busy: false, error: "" });
        const config = await apiJson("/api/auth/google/config", { signal: controller.signal });
        if (!active) return;
        if (!config.enabled) throw new Error("El acceso con Google no está configurado en este momento.");
        setState({ enabled: true, loading: true, busy: false, error: "" });
        const [challenge, google] = await Promise.all([
          apiJson("/api/auth/google/challenge", { method: "POST", body: { purpose }, signal: controller.signal }),
          loadGoogle(),
        ]);
        if (!active) return;
        google.initialize({
          client_id: config.clientId, nonce: challenge.nonce, auto_select: false, ux_mode: "popup",
          callback: async ({ credential }) => {
            if (!active || used) return;
            used = true;
            setInteracted(true);
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
          // A hidden parent has no width. Wait for layout rather than drawing a
          // 200px fallback and immediately replacing it with the real size.
          if (!container.clientWidth) return;
          const width = Math.min(400, Math.max(200, Math.floor(container.clientWidth)));
          if (renderedWidth === width && container.hasChildNodes()) return;
          renderedWidth = width;
          setState({ enabled: true, loading: true, busy: false, error: "" });
          window.clearTimeout(renderTimeout);
          container.replaceChildren();
          // Google's medium variant always uses generic text instead of account personalization.
          google.renderButton(container, { theme: "outline", size: "medium", text: "continue_with", shape: "pill", locale: "es", width });
          renderTimeout = window.setTimeout(() => {
            if (active && !used) setState({ enabled: true, loading: false, busy: false, error: "No se pudo mostrar el botón de Google. Vuelve a intentarlo." });
          }, 15000);
        };
        render();
        observer = new ResizeObserver(() => {
          window.clearTimeout(resizeTimeout);
          resizeTimeout = window.setTimeout(render, 100);
        });
        if (container) observer.observe(container);
        expiration = window.setTimeout(() => {
          used = true;
          if (active) setState({ enabled: true, loading: false, busy: false, error: "La confirmación ha caducado. Vuelve a preparar el acceso con Google." });
        }, 285000);
      } catch (error) {
        window.clearTimeout(preparationTimeout);
        if (active && error.name !== "AbortError") setState({ enabled: true, loading: false, busy: false, error: error.message });
      }
    }
    prepare();
    return () => {
      active = false;
      controller.abort();
      observer?.disconnect();
      window.clearTimeout(expiration);
      window.clearTimeout(renderTimeout);
      window.clearTimeout(resizeTimeout);
      window.clearTimeout(preparationTimeout);
      container?.removeEventListener("load", revealButton, true);
      container?.replaceChildren();
    };
  }, [purpose, attempt]);

  return (
    <div className="my-5 min-w-0 space-y-3">
      {separator ? <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]"><span className="h-px flex-1 bg-white/10" />o continúa con Google<span className="h-px flex-1 bg-white/10" /></div> : null}
      {/* Google's light button needs a light color scheme for its iframe to stay transparent. */}
      <div className="relative mx-auto min-h-11 min-w-0 w-full max-w-[400px]">
        <div ref={containerRef} style={{ colorScheme: "light" }} aria-hidden={state.loading || state.busy || !!state.error || !state.enabled} className={`flex min-h-11 min-w-0 w-full items-center justify-center overflow-hidden ${state.loading || state.busy || state.error || !state.enabled ? "invisible pointer-events-none" : ""}`} />
        {state.loading || state.busy || state.error || !state.enabled ? (
          <div className="absolute inset-0 flex items-center">
            <button type="button" disabled={state.busy} onClick={() => setInteracted(true)} className="relative flex h-8 w-full items-center justify-center rounded-full border border-[#dadce0] bg-white px-10 text-[14px] font-medium text-[#3c4043] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-wait" style={{ fontFamily: 'Arial, sans-serif', colorScheme: 'light' }}>
              <svg viewBox="0 0 48 48" className="absolute left-2.5 h-[18px] w-[18px]" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.02 46.98 31.87 46.98 24.55Z" />
                <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
              </svg>
              {state.busy ? "Verificando tu cuenta…" : "Continuar con Google"}
            </button>
          </div>
        ) : null}
      </div>
      {interacted && !state.busy && !state.error ? <p role="status" className="text-center text-sm text-slate-400">{state.loading ? "Preparando el acceso con Google…" : "Google está listo. Pulsa el botón para continuar."}</p> : null}
      {interacted && state.error ? <div role="alert" className="space-y-2 text-sm text-rose-300"><p>{state.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="min-h-11 rounded-xl border border-white/10 px-4 text-slate-200">Volver a intentar con Google</button></div> : null}
    </div>
  );
}
