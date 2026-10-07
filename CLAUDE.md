# cv-web

Frontend for cv.jakoblui.com: choose a title, concepts and skills, generate a tailored CV PDF through the api, share the result as a link.

## Commands
```sh
pnpm install
pnpm dev               # http://localhost:3000; /api is proxied to the api on :8000 (prefix stripped)
pnpm lint
pnpm test              # Vitest, including Storybook stories in a Playwright browser
pnpm build             # vite build + tsc --noEmit
pnpm storybook         # :6006
pnpm generate:api      # Orval → src/api/generated (never edit by hand)
```

## Stack
React 19, Vite, TanStack Router (file routes in `src/routes`, `routeTree.gen.ts` is generated), TanStack Query, Tailwind 4, shadcn on Base UI (`src/components`), zod, Storybook 10.

## API client
- Orval reads the api's OpenAPI spec, filtered to the `cv` tag. It generates react-query hooks with the `fetch` client, zod schemas (`src/api/generated/model`) and runtime validation, with base URL `/api`.
- Hook names come from operationIds (`cv_get_options` → `cvGetOptions`, …).
- Hand-written wrappers go in `src/api/` outside `generated/`.

## Contracts consumed (api)
- `GET /cv/options` → `FormOptionsResponse` (503 if not published yet).
- `POST /cv/generate` → 202 `{task_id}`; 422 in FastAPI's standard `HTTPValidationError` shape (`loc` like `["body","skill_ids",0]`); 429 from Traefik.
- `GET /cv/generate/{task_id}` → `{state: pending|done|failed, digest}`.
- `GET /cv/pdf/{digest}` → `application/pdf`.

## Gotchas
- Deploys build two images (`cv-web`, `cv-web-storybook`); storybook-host composes the Storybook.
