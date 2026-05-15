export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type TestApiResponse = {
  status: string;
  version: string;
};

export type DbTestResponse = {
  ok: boolean;
  connected: boolean;
  firstRecord: { id: number; name: string | null; email: string | null } | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUserDto = {
  id: string;
  name: string;
  email: string;
  role: "coordinator" | "tutor";
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
};
