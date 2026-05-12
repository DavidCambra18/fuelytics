import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem("token") || "");
	const [username, setUsername] = useState(() => localStorage.getItem("username") || "");

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

	const setAuth = useCallback(({ token: nextToken, username: nextUsername }) => {
		setToken(nextToken || "");
		setUsername(nextUsername || "");
	}, []);

	const clearAuth = useCallback(() => {
		setToken("");
		setUsername("");
	}, []);

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
