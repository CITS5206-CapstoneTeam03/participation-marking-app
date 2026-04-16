import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { ApiError } from "../interface/apiTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 500;
    const details = error.response?.data;
    const message =
      typeof details === "object" &&
        details !== null &&
        "detail" in details &&
        typeof details.detail === "string"
        ? details.detail
        : error.message || `Request failed with status ${status}`;

    return Promise.reject(new ApiError(message, status));
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}
