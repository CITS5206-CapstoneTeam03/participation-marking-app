import { apiRequest } from "../axios-instance";

export type StudentDto = {
  student_id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  email: string;
  image_url?: string | null;
  status: "active" | "withdrawn";
  created_at: string;
  updated_at?: string | null;
};

export type UpdateStudentInput = Partial<{
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  image_url: string | null;
  status: "active" | "withdrawn";
}>;

export function getStudents(): Promise<StudentDto[]> {
  return apiRequest<StudentDto[]>({
    method: "GET",
    url: "/students/",
  });
}

export function getStudentById(studentId: string): Promise<StudentDto> {
  return apiRequest<StudentDto>({
    method: "GET",
    url: `/students/${studentId}`,
  });
}

export function updateStudent(
  studentId: string,
  payload: UpdateStudentInput,
): Promise<StudentDto> {
  return apiRequest<StudentDto>({
    method: "PATCH",
    url: `/students/${studentId}`,
    data: payload,
  });
}