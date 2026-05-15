import { apiRequest } from "../axios-instance";

export type EnabledWeekDto = {
  week_number: number;
};

export function getEnabledWeeks(): Promise<EnabledWeekDto[]> {
  return apiRequest<EnabledWeekDto[]>({
    method: "GET",
    url: "/enabled-weeks/",
  });
}

export function createEnabledWeek(weekNumber: number): Promise<EnabledWeekDto> {
  return apiRequest<EnabledWeekDto>({
    method: "POST",
    url: "/enabled-weeks/",
    data: { week_number: weekNumber },
  });
}

export function replaceEnabledWeeks(weekNumbers: number[]): Promise<EnabledWeekDto[]> {
  return apiRequest<EnabledWeekDto[]>({
    method: "PUT",
    url: "/enabled-weeks/",
    data: { week_numbers: weekNumbers },
  });
}

export function deleteEnabledWeek(weekNumber: number): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    url: `/enabled-weeks/${weekNumber}`,
  });
}
