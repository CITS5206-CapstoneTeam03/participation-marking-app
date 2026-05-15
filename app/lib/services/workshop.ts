import { apiRequest } from "../axios-instance";

export type WorkshopDto = {
  workshop_id: number;
  workshop_name: string;
  tutor_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type WorkshopStudentDto = {
  student_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  image_url: string | null;
  status: "active" | "withdrawn";
  created_at: string;
  updated_at: string | null;
};

export type CreateWorkshopInput = {
  workshop_name: string;
  tutor_user_id?: string | null;
  is_active?: boolean;
};

export type UpdateWorkshopInput = Partial<CreateWorkshopInput>;

export function getWorkshops(): Promise<WorkshopDto[]> {
  return apiRequest<WorkshopDto[]>({
    method: "GET",
    url: "/workshops/",
  });
}

export function getWorkshopById(workshopId: string): Promise<WorkshopDto> {
  return apiRequest<WorkshopDto>({
    method: "GET",
    url: `/workshops/${workshopId}`,
  });
}

export function getWorkshopStudents(workshopId: string): Promise<WorkshopStudentDto[]> {
  return apiRequest<WorkshopStudentDto[]>({
    method: "GET",
    url: `/workshops/students/${workshopId}`,
  });
}

export function createWorkshopApi(payload: CreateWorkshopInput): Promise<WorkshopDto> {
  return apiRequest<WorkshopDto>({
    method: "POST",
    url: "/workshops/",
    data: {
      workshop_name: payload.workshop_name,
      tutor_user_id: payload.tutor_user_id ?? null,
      is_active: payload.is_active ?? true,
    },
  });
}

export function updateWorkshopApi(workshopId: string, payload: UpdateWorkshopInput): Promise<WorkshopDto> {
  return apiRequest<WorkshopDto>({
    method: "PATCH",
    url: `/workshops/${workshopId}`,
    data: payload,
  });
}

export function deleteWorkshopApi(workshopId: string): Promise<void> {
  return apiRequest<void>({
    method: "DELETE",
    url: `/workshops/${workshopId}`,
  });
}
