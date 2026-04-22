import { apiRequest } from "../axios-instance";

export type UserDto = {
    id: number;
    name: string | null;
    email: string | null;
};

export type CreateUserInput = {
    name: string;
    email: string;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export function getUsers(): Promise<UserDto[]> {
    return apiRequest<UserDto[]>({
        method: "GET",
        url: "/users",
    });
}

export function getUserById(userId: number): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "GET",
        url: `/users/${userId}`,
    });
}

export function createUser(payload: CreateUserInput): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "POST",
        url: "/users",
        data: payload,
    });
}

export function updateUser(userId: number, payload: UpdateUserInput): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "PUT",
        url: `/users/${userId}`,
        data: payload,
    });
}

export function deleteUser(userId: number): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>({
        method: "DELETE",
        url: `/users/${userId}`,
    });
}
