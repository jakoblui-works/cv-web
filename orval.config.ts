// orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  cv: {
    input: {
      target: "https://cv.jakoblui.com/api/openapi.json",
      filters: { tags: ["cv"] },
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated/endpoints.ts",
      schemas: { path: "src/api/generated/model", type: "zod" },
      client: "react-query",
      httpClient: "fetch",
      baseUrl: "/api",
      clean: true,
      override: {
        // customFetch throws ApiError on any non-2xx (JSON or not) and validates success bodies
        // with the schema Orval passes in, so the generated types only describe success.
        mutator: { path: "src/api/fetcher.ts", name: "customFetch" },
        includeZodSchemaInArguments: true,
        fetch: { runtimeValidation: true, forceSuccessResponse: true },
      },
    },
  },
});
