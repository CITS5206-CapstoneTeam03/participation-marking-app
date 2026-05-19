import { apiRequest } from "../axios-instance";

export type SystemConfigDto = {
  config_id: number;
  coordinator_user_id: string;
  max_weekly_score: number;
  total_participation_points: number | null;
  is_configured: boolean;
  week6_lock_enabled: boolean;
  week6_locked_at: string | null;
  week12_lock_enabled: boolean;
  week12_locked_at: string | null;
  updated_by_user_id: string | null;
  updated_at: string;
};

export type SystemConfigPayload = {
  coordinator_user_id: string;
  max_weekly_score: number;
  total_participation_points: number | null;
  is_configured: boolean;
  week6_lock_enabled: boolean;
  week6_locked_at: string | null;
  week12_lock_enabled: boolean;
  week12_locked_at: string | null;
  updated_by_user_id: string | null;
};

export function getCurrentSystemConfig(): Promise<SystemConfigDto> {
  return apiRequest<SystemConfigDto>({
    method: "GET",
    url: "/system-config/current",
  });
}

export function createSystemConfig(payload: SystemConfigPayload): Promise<SystemConfigDto> {
  return apiRequest<SystemConfigDto>({
    method: "POST",
    url: "/system-config/",
    data: payload,
  });
}

export function updateCurrentSystemConfig(payload: Partial<SystemConfigPayload>): Promise<SystemConfigDto> {
  return apiRequest<SystemConfigDto>({
    method: "PATCH",
    url: "/system-config/current",
    data: payload,
  });
}
