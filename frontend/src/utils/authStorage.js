import { isTokenValid } from "../context/auth.js";

export function readStoredAuth(storage) {
  const token = storage.getItem("token") || "";
  return isTokenValid(token) ? { token, username: storage.getItem("username") || "" } : { token: "", username: "" };
}

export function discardExpiredStoredAuth(storage) {
  const stored = storage.getItem("token");
  if (stored && !isTokenValid(stored) && storage.getItem("token") === stored) {
    storage.removeItem("token");
    storage.removeItem("username");
  }
}

export function observeStoredAuth(target, storage, publish) {
  const sync = (event) => {
    if (event.storageArea !== storage || ![null, "token", "username"].includes(event.key)) return;
    publish(readStoredAuth(storage));
  };
  target.addEventListener("storage", sync);
  return () => target.removeEventListener("storage", sync);
}

// A different account must not reuse the previous account's private route state.
// Refreshing a token for the same account keeps the shell and its context stable.
export function sessionIdentity(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.userId && payload.sub ? `${payload.userId}:${payload.sub}` : token;
  } catch { return "anonymous"; }
}
