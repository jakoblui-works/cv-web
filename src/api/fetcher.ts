import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Request failed with ${status}`);
    this.name = "ApiError";
  }
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit & { schema?: ZodType },
): Promise<T> => {
  const { schema, ...rest } = options;
  const res = await fetch(url, rest);

  const text = await res.text();
  const isJson = (res.headers.get("content-type") ?? "").includes("json");
  const body: unknown = !text ? undefined : isJson ? JSON.parse(text) : text;

  if (!res.ok) throw new ApiError(res.status, body);

  const data = schema ? schema.parse(body) : body;
  return { data, status: res.status, headers: res.headers } as T;
};
