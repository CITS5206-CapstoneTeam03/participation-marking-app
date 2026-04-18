import { apiRequest } from "../axios-instance";
import type { AuthTokenResponse, AuthUserDto, LoginInput } from "../../interface/apiTypes";

export const AUTH_TOKEN_KEY = "pms-auth-token";

export function loginApi(payload: LoginInput): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>({
    method: "POST",
    url: "/auth/login",
    data: payload,
  });
}

export function logoutApi(): Promise<void> {
  return apiRequest<void>({ method: "POST", url: "/auth/logout" });
}

export function getMe(): Promise<AuthUserDto> {
  return apiRequest<AuthUserDto>({ method: "GET", url: "/auth/me" });
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
