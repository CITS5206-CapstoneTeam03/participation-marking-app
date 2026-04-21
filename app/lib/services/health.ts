import type { DbTestResponse, TestApiResponse } from "../../interface/apiTypes";
import { apiRequest } from "../axios-instance";

export function testApi(): Promise<TestApiResponse> {
    return apiRequest({
        method: "GET",
        url: "/test",
    });
}

export function testDb(): Promise<DbTestResponse> {
    return apiRequest({
        method: "GET",
        url: "/db-test",
    });
}
