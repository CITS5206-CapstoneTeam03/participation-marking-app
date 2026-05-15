import { apiRequest } from "../axios-instance";

export type UserDto = {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    display_name: string;
    role: "UC" | "tutor" | "admin";
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
};

export type CreateUserInput = {
    email: string;
    first_name: string;
    last_name: string;
    preferred_name?: string | null;
    display_name: string;
    role: "UC" | "tutor" | "admin";
    is_active?: boolean;
    password: string;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export function getUsers(): Promise<UserDto[]> {
    return apiRequest<UserDto[]>({
        method: "GET",
        url: "/users/",
        params: {
            skip: 0,
            limit: 100,
        },
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
