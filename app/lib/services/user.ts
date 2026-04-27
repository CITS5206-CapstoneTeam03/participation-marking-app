import { apiRequest } from "../axios-instance";
import type { UserDto } from "../../interface/apiTypes";

export type CreateUserInput = {
    first_name: string;
    last_name: string;
    display_name: string;
    email: string;
    role: "UC" | "tutor";
    password: string;
    preferred_name?: string | null;
    is_active?: boolean;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export function getUsers(): Promise<UserDto[]> {
    return apiRequest<UserDto[]>({
        method: "GET",
        url: "/users/",
    });
}

export function getUserById(userId: string): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "GET",
        url: `/users/${userId}`,
    });
}

export function createUser(payload: CreateUserInput): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "POST",
        url: "/users/",
        data: payload,
    });
}

export function updateUser(userId: string, payload: UpdateUserInput): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "PATCH",
        url: `/users/${userId}`,
        data: payload,
    });
}

export function deleteUser(userId: string): Promise<void> {
    return apiRequest<void>({
        method: "DELETE",
        url: `/users/${userId}`,
    });
}
