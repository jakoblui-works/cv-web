# cv-web

Frontend for cv.jakoblui.com: choose a title, concepts and skills, generate a tailored CV PDF through the api, share the result as a link.

## Commands
```sh
pnpm install
pnpm dev               # http://localhost:3000; /api is proxied to the api on :8000 (prefix stripped)
pnpm dev:prod          # same, but proxied to the prod api (generate is rate-limited; PDFs land in the prod bucket)
pnpm lint
pnpm test              # Vitest, including Storybook stories in a Playwright browser
pnpm build             # vite build + the prerender + tsc --noEmit
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

## Template
Made from `web-template` (`.copier-answers.yml`). Template changes arrive through `copier update --trust`; don't edit the answers by hand. cv-web's own additions to template files: `stringifySearch` (keeps commas readable in URLs) and the Query devtools in `router.tsx`, the view-transition CSS in `styles.css`, the `og:image` lines and `#ffffff` `theme-color` in `index.html`, the `data-cv-link` script (with `main.tsx` and `styles.css`), the `og` script in `package.json`, the `surface` and disabled changes in `ui/button.tsx`, the `matchMedia` stub in `test-setup.ts`.

## Gotchas
- `pnpm build` prerenders `/` and `404.html` in Node, then the browser hydrates them. Anything the editing layout renders can't touch `window` or `document` while rendering; the result layout can, as it's never prerendered. Links with a selection hide the prerendered form until the app replaces it (`data-cv-link`).
- Deploys build two images (`cv-web`, `cv-web-storybook`); storybook-host composes the Storybook.
- The header, site switcher and shared theme tokens come from `@jakoblui-works/shared-ui` (GitHub Packages). Installing needs a token with `read:packages`, even though the package is public (see shared-ui's `CLAUDE.md`). CI uses `GITHUB_TOKEN`, and the Docker builds take it as `--secret id=npm_token,env=NODE_AUTH_TOKEN`. `styles.css` only holds cv-web's own palette and CSS. If `shadcn add` writes tokens into it, move the shared ones into shared-ui.
