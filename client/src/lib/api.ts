import axios from "axios";

const API_BASE = "/api";

// Public client (no auth) — login, refresh, signup
export const publicApi = axios.create({ baseURL: API_BASE });

// Authenticated client — auto-adds Bearer token, auto-refreshes on 401
export const api = axios.create({ baseURL: API_BASE });

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function setTokens(tokens: { access_token: string; refresh_token: string }) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  localStorage.setItem("rt", tokens.refresh_token);
}

export function removeTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("rt");
}

export function getAccessToken() {
  return accessToken;
}

export async function initializeAuth(): Promise<boolean> {
  const stored = localStorage.getItem("rt");
  if (!stored) return false;

  refreshToken = stored;
  try {
    const res = await publicApi.post("/auth/refresh", { refresh_token: stored });
    accessToken = res.data.access_token;
    refreshToken = res.data.refresh_token;
    localStorage.setItem("rt", res.data.refresh_token);
    return true;
  } catch {
    removeTokens();
    return false;
  }
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Request interceptor — add Bearer token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await publicApi.post("/auth/refresh", { refresh_token: refreshToken });
        setTokens(res.data);
        isRefreshing = false;
        onRefreshed(res.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        removeTokens();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
