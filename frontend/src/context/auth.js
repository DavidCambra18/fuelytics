import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function getTokenExpiry(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(paddedBase64));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  const expiresAt = getTokenExpiry(token);
  return Boolean(expiresAt && expiresAt > Date.now());
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
