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
  id: number;
  name: string;
  email: string;
  role: "coordinator" | "tutor";
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUserDto;
};

export type BackendUserRole = "UC" | "tutor";

export type UserDto = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  display_name: string;
  role: BackendUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type WorkshopDto = {
  workshop_id: number;
  workshop_name: string;
  tutor_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type StudentDto = {
  student_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

export type EnabledWeekDto = {
  week_number: number;
  created_at: string;
};

export type SystemConfigDto = {
  config_id: number;
  coordinator_user_id: string;
  max_weekly_score: number;
  total_participation_points: number;
  is_configured: boolean;
  week6_lock_enabled: boolean;
  week6_locked_at: string | null;
  week12_lock_enabled: boolean;
  week12_locked_at: string | null;
  updated_by_user_id: string | null;
  updated_at: string;
};

export type MarkDto = {
  mark_id: number;
  student_id: string;
  workshop_id: number;
  week_number: number;
  score: number;
  marked_by_user_id: string;
  marked_at: string;
  updated_at: string | null;
};
