// A synchronous gate closes the same-tick gap before React renders disabled.
export function createActionGate() {
  let busy = false, active = true;
  return {
    activate: () => { active = true; },
    dispose: () => { active = false; },
    isActive: () => active,
    guard: (action) => async (...args) => {
      args[0]?.preventDefault?.();
      if (busy || !active) return;
      busy = true;
      try { return await action(...args); }
      finally { busy = false; }
    },
  };
}
