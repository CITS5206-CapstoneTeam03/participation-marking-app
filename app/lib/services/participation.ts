import { apiRequest } from "../axios-instance";
import type {
  EnabledWeekDto,
  MarkDto,
  StudentDto,
  SystemConfigDto,
  UserDto,
  WorkshopDto,
} from "../../interface/apiTypes";

export type CreateWorkshopPayload = {
  workshop_name: string;
  tutor_user_id?: string | null;
  is_active?: boolean;
};

export type UpdateWorkshopPayload = Partial<CreateWorkshopPayload>;

export type CreateMarkPayload = {
  student_id: string;
  workshop_id: number;
  week_number: number;
  score: number;
  marked_by_user_id: string;
};

export type UpdateMarkPayload = Partial<CreateMarkPayload>;

export function getBackendUsers(): Promise<UserDto[]> {
  return apiRequest<UserDto[]>({ method: "GET", url: "/users/" });
}

export function getBackendWorkshops(): Promise<WorkshopDto[]> {
  return apiRequest<WorkshopDto[]>({ method: "GET", url: "/workshops/" });
}

export function createBackendWorkshop(payload: CreateWorkshopPayload): Promise<WorkshopDto> {
  return apiRequest<WorkshopDto>({ method: "POST", url: "/workshops/", data: payload });
}

export function updateBackendWorkshop(
  workshopId: number,
  payload: UpdateWorkshopPayload,
): Promise<WorkshopDto> {
  return apiRequest<WorkshopDto>({
    method: "PATCH",
    url: `/workshops/${workshopId}`,
    data: payload,
  });
}

export function deleteBackendWorkshop(workshopId: number): Promise<void> {
  return apiRequest<void>({ method: "DELETE", url: `/workshops/${workshopId}` });
}

export function getBackendStudents(): Promise<StudentDto[]> {
  return apiRequest<StudentDto[]>({ method: "GET", url: "/students/" });
}

export function getEnabledWeeks(): Promise<EnabledWeekDto[]> {
  return apiRequest<EnabledWeekDto[]>({ method: "GET", url: "/enabled-weeks/" });
}

export function replaceEnabledWeeks(weekNumbers: number[]): Promise<EnabledWeekDto[]> {
  return apiRequest<EnabledWeekDto[]>({
    method: "PUT",
    url: "/enabled-weeks/",
    data: { week_numbers: weekNumbers },
  });
}

export function getCurrentSystemConfig(): Promise<SystemConfigDto> {
  return apiRequest<SystemConfigDto>({ method: "GET", url: "/system-config/current" });
}

export function updateCurrentSystemConfig(
  payload: Partial<SystemConfigDto>,
): Promise<SystemConfigDto> {
  return apiRequest<SystemConfigDto>({
    method: "PATCH",
    url: "/system-config/current",
    data: payload,
  });
}

export function getWorkshopWeekMarks(
  workshopId: number,
  weekNumber: number,
): Promise<MarkDto[]> {
  return apiRequest<MarkDto[]>({
    method: "GET",
    url: `/marks/workshop/${workshopId}/week/${weekNumber}`,
  });
}

export function createMark(payload: CreateMarkPayload): Promise<MarkDto> {
  return apiRequest<MarkDto>({ method: "POST", url: "/marks/", data: payload });
}

export function updateMark(markId: number, payload: UpdateMarkPayload): Promise<MarkDto> {
  return apiRequest<MarkDto>({
    method: "PATCH",
    url: `/marks/${markId}`,
    data: payload,
  });
}

