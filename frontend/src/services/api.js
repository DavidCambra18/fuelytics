import { API_BASE } from "../config/api";

function normalizeBaseUrl(baseUrl) {
	return (baseUrl || "").replace(/\/$/, "");
}

export function buildApiUrl(path = "") {
	if (!path) {
		return normalizeBaseUrl(API_BASE);
	}

	if (/^https?:\/\//i.test(path)) {
		return path;
	}

	const normalizedBaseUrl = normalizeBaseUrl(API_BASE);
	const normalizedPath = path.replace(/^\/+/, "");

	if (!normalizedBaseUrl) {
		return `/${normalizedPath}`;
	}

	return `${normalizedBaseUrl}/${normalizedPath}`;
}

export function getAuthToken() {
	if (typeof localStorage === "undefined") {
		return "";
	}

	return localStorage.getItem("token") || "";
}

export function getAuthHeaders(headers = {}) {
	const token = getAuthToken();

	if (!token) {
		return { ...headers };
	}

	return {
		...headers,
		Authorization: `Bearer ${token}`,
	};
}

export async function apiFetch(path, options = {}) {
	const { headers = {}, body, ...restOptions } = options;
	const finalHeaders = new Headers(getAuthHeaders(headers));

	if (body && !(body instanceof FormData) && !finalHeaders.has("Content-Type")) {
		finalHeaders.set("Content-Type", "application/json");
	}

	const requestBody =
		body && finalHeaders.get("Content-Type") === "application/json" && typeof body !== "string"
			? JSON.stringify(body)
			: body;

	try {
		return await fetch(buildApiUrl(path), {
			...restOptions,
			headers: finalHeaders,
			body: requestBody,
		});
	} catch (error) {
		if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
			throw new Error("Error al conectar con el servidor.");
		}
		throw error;
	}
}

export async function apiJson(path, options = {}) {
	const response = await apiFetch(path, options);
	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || payload.error || "Error en la solicitud");
	}

	return payload;
}