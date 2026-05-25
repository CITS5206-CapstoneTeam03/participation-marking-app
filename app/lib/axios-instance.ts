import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { ApiError } from "../interface/apiTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const AUTH_TOKEN_KEY = "pms-auth-token";
const AUTH_EMAIL_KEY = "pms-auth-email";
const AUTH_EXPIRES_AT_KEY = "pms-auth-expires-at";

function clearStoredAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;

  window.location.assign("/login");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach stored JWT to every request if present
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const expiresAt =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_EXPIRES_AT_KEY) : null;

  if (expiresAt && Date.now() >= Date.parse(expiresAt)) {
    clearStoredAuth();
    redirectToLogin();
    return Promise.reject(new ApiError("Your session has expired. Please log in again.", 401));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 500;
    const details = error.response?.data;

    if (status === 401) {
      clearStoredAuth();
      redirectToLogin();
    }

    const message =
      typeof details === "object" &&
        details !== null &&
        "detail" in details &&
        typeof details.detail === "string"
        ? details.detail
        : error.message || `Request failed with status ${status}`;

    return Promise.reject(new ApiError(message, status));
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}
