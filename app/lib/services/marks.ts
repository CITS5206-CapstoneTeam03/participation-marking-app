import { apiRequest } from "../axios-instance";
import type { Score } from "../marking-types";

export type MarkDto = {
  mark_id: number;
  student_id: string;
  workshop_id: number;
  week_number: number;
  score: Score;
  marked_at: string;
  updated_at: string | null;
  marked_by_user_id: string;
};

export type CreateMarkInput = {
  student_id: string;
  workshop_id: number;
  week_number: number;
  score: Score;
};

export type UpdateMarkInput = {
  score: Score;
};

export function getMarksByWorkshopAndWeek(
  workshopId: string,
  weekNumber: number,
): Promise<MarkDto[]> {
  return apiRequest<MarkDto[]>({
    method: "GET",
    url: `/marks/workshop/${workshopId}/week/${weekNumber}`,
  });
}

export function createMark(payload: CreateMarkInput): Promise<MarkDto> {
  return apiRequest<MarkDto>({
    method: "POST",
    url: "/marks/",
    data: payload,
  });
}

export function updateMark(markId: number, payload: UpdateMarkInput): Promise<MarkDto> {
  return apiRequest<MarkDto>({
    method: "PATCH",
    url: `/marks/${markId}`,
    data: payload,
  });
}

export function exportGradesApi(
  isHalfSemester: boolean,
  file: File,
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<Blob>({
    method: "POST",
    url: isHalfSemester ? "/marks/export/half_semester" : "/marks/export/semester",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
}

