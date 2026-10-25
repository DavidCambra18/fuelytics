import { useCallback, useEffect, useMemo, useState } from "react";
import { discardExpiredStoredAuth, observeStoredAuth, readStoredAuth } from "../utils/authStorage";
import { AuthContext, getTokenExpiry } from "./auth";

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => readStoredAuth(localStorage).token);
	const [username, setUsername] = useState(() => readStoredAuth(localStorage).username);
	const setAuth = useCallback(({ token: nextToken, username: nextUsername }) => {
		if (nextToken) localStorage.setItem("token", nextToken);
		else localStorage.removeItem("token");
		if (nextUsername) localStorage.setItem("username", nextUsername);
		else localStorage.removeItem("username");
		setToken(nextToken || "");
		setUsername(nextUsername || "");
	}, []);

	const clearAuth = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("username");
		setToken("");
		setUsername("");
	}, []);

	useEffect(() => {
		discardExpiredStoredAuth(localStorage);
		return observeStoredAuth(window, localStorage, (auth) => {
			setToken(auth.token);
			setUsername(auth.username);
		});
	}, []);

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
			if (localStorage.getItem("token") === token) clearAuth();
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
