import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, getTokenExpiry, isTokenValid } from "./auth";

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => {
		const storedToken = localStorage.getItem("token") || "";
		return isTokenValid(storedToken) ? storedToken : "";
	});
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
		window.addEventListener("fuelytics:unauthorized", clearAuth);
		return () => window.removeEventListener("fuelytics:unauthorized", clearAuth);
	}, [clearAuth]);

	useEffect(() => {
		if (!token) {
			return;
		}

		const expiresAt = getTokenExpiry(token);

		const timeoutId = window.setTimeout(() => {
			clearAuth();
		}, Math.max(expiresAt - Date.now(), 0));

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
