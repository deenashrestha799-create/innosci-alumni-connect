import { getToken } from "./auth";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  return fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}