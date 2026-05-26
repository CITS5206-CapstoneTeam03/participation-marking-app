import { apiRequest } from "../axios-instance";
import type { AuthTokenResponse, AuthUserDto, LoginInput } from "../../interface/apiTypes";
import { getCurrentUser, type UserDto } from "./user";

export const AUTH_TOKEN_KEY = "pms-auth-token";
const AUTH_EMAIL_KEY = "pms-auth-email";
const AUTH_EXPIRES_AT_KEY = "pms-auth-expires-at";

function toAuthUser(user: UserDto): AuthUserDto {
  return {
    id: user.user_id,
    name: user.display_name || `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
    role: user.role === "tutor" ? "tutor" : "coordinator",
  };
}

export function loginApi(payload: LoginInput): Promise<AuthTokenResponse> {
  const body = new URLSearchParams();
  body.set("username", payload.email);
  body.set("password", payload.password);

  return apiRequest<AuthTokenResponse>({
    method: "POST",
    url: "/auth/login",
    data: body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

export async function getAuthenticatedUser(): Promise<AuthUserDto> {
  return toAuthUser(await getCurrentUser());
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const expiresAt = localStorage.getItem(AUTH_EXPIRES_AT_KEY);
  if (expiresAt && Date.now() >= Date.parse(expiresAt)) {
    clearStoredToken();
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string, expiresAt: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_EXPIRES_AT_KEY, expiresAt);
}

export function setStoredEmail(email: string): void {
  localStorage.setItem(AUTH_EMAIL_KEY, email);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
}
