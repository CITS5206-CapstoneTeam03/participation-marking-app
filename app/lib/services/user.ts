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

const USER_PAGE_SIZE = 100;

function getUserPage(skip: number): Promise<UserDto[]> {
    return apiRequest<UserDto[]>({
        method: "GET",
        url: "/users/",
        params: {
            skip,
            limit: USER_PAGE_SIZE,
        },
    });
}

export async function getUsers(): Promise<UserDto[]> {
    const users: UserDto[] = [];
    let skip = 0;
    let page: UserDto[];

    do {
        page = await getUserPage(skip);
        users.push(...page);
        skip += USER_PAGE_SIZE;
    } while (page.length === USER_PAGE_SIZE);

    return users;
}

export function getCurrentUser(): Promise<UserDto> {
    return apiRequest<UserDto>({
        method: "GET",
        url: "/me",
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
