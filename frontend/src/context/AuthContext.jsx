import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

function getTokenExpiry(token) {
	if (!token) {
		return null;
	}

	const parts = token.split(".");

	if (parts.length !== 3) {
		return null;
	}

	try {
		const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
		const payload = JSON.parse(atob(paddedBase64));

		if (typeof payload.exp !== "number") {
			return null;
		}

		return payload.exp * 1000;
	} catch {
		return null;
	}
}

export function isTokenValid(token) {
	const expiresAt = getTokenExpiry(token);

	if (!expiresAt) {
		return false;
	}

	return expiresAt > Date.now();
}

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem("token") || "");
	const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
	const setAuth = useCallback(({ token: nextToken, username: nextUsername }) => {
		setToken(nextToken || "");
		setUsername(nextUsername || "");
	}, []);

	const clearAuth = useCallback(() => {
		setToken("");
		setUsername("");
	}, []);

	useEffect(() => {
		if (token) {
			localStorage.setItem("token", token);
		} else {
			localStorage.removeItem("token");
		}

		if (username) {
			localStorage.setItem("username", username);
		} else {
			localStorage.removeItem("username");
		}
	}, [token, username]);

	useEffect(() => {
		if (!token) {
			return;
		}

		const expiresAt = getTokenExpiry(token);

		if (!expiresAt || expiresAt <= Date.now()) {
			clearAuth();
			return;
		}

		const timeoutId = window.setTimeout(() => {
			clearAuth();
		}, expiresAt - Date.now());

		return () => window.clearTimeout(timeoutId);
	}, [token, clearAuth]);

	const value = useMemo(
		() => ({
			token,
			username,
			setAuth,
			clearAuth,
		}),
		[token, username, setAuth, clearAuth]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}
