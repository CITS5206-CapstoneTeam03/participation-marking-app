import { apiRequest } from "../axios-instance";
import type { AuthTokenResponse, AuthUserDto, LoginInput } from "../../interface/apiTypes";
import { getUserById, getUsers, type UserDto } from "./user";

export const AUTH_TOKEN_KEY = "pms-auth-token";
const AUTH_EMAIL_KEY = "pms-auth-email";

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

export async function getAuthenticatedUserByEmail(email: string): Promise<AuthUserDto> {
  const users = await getUsers();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error("Authenticated user was not found in the user list.");
  }
  return toAuthUser(await getUserById(user.user_id));
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function setStoredEmail(email: string): void {
  localStorage.setItem(AUTH_EMAIL_KEY, email);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
}
