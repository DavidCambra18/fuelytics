const PREFIX = "fuelytics:welcome-tour:v1:";
const memory = new Map();
const keyFor = (username) => typeof username === "string" && username.trim() ? `${PREFIX}${username.trim().toLowerCase()}` : null;
const browserStorage = () => typeof window === "undefined" ? undefined : window.localStorage;

export function getTourStatus(username, storage) {
  const key = keyFor(username);
  if (!key) return null;
  if (memory.has(key)) return memory.get(key);
  try { return (storage ?? browserStorage())?.getItem(key) || null; } catch { return null; }
}

export function setTourStatus(username, status, storage) {
  const key = keyFor(username);
  if (!key || !["pending", "completed", "skipped"].includes(status)) return;
  memory.set(key, status);
  try { (storage ?? browserStorage())?.setItem(key, status); } catch { /* A browser preference must never block registration or sign-in. */ }
}

export function queueWelcomeTour(username) {
  setTourStatus(username, "pending");
}

export function placeTourPanel(target, panel, viewport) {
  const margin = 12;
  const gap = 14;
  const width = Math.min(400, viewport.width - margin * 2);
  const height = Math.min(panel.height, viewport.height - margin * 2);
  const clamp = (value, max) => Math.max(margin, Math.min(value, max - margin));
  if (!target) return { left: (viewport.width - width) / 2, top: (viewport.height - height) / 2, width };
  const centeredY = clamp(target.top + target.height / 2 - height / 2, viewport.height - height);
  if (target.right + gap + width <= viewport.width - margin) return { left: target.right + gap, top: centeredY, width };
  if (target.left - gap - width >= margin) return { left: target.left - gap - width, top: centeredY, width };
  const left = clamp(target.left + target.width / 2 - width / 2, viewport.width - width);
  if (target.top - gap - height >= margin) return { left, top: target.top - gap - height, width };
  return { left, top: clamp(target.bottom + gap, viewport.height - height), width };
}
