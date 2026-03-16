import { ApiError } from "../interface/apiTypes";
import type { TestApiResponse } from "../interface/apiTypes";

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    throw new ApiError(`Request failed with status ${res.status}`, res.status);
  }

  return (await res.json()) as T;
}

export async function testApi(): Promise<TestApiResponse> {
  return fetchJson<TestApiResponse>("/api/test");
}

