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
        fetch: { runtimeValidation: true },
      },
    },
  },
});
