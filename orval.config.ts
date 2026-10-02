// orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  cv: {
    input: {
      target: "http://localhost:8000/openapi.json",
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
        fetch: { runtimeValidation: true },
      },
    },
  },
});
