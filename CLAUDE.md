# cv-web

Frontend for cv.jakoblui.com: choose a title, concepts and skills, generate a tailored CV PDF through the api, share the result as a link. Made from `web-template` (Copier); `.copier-answers.yml` records the version.

## Commands
```sh
pnpm install
pnpm dev               # http://localhost:3000 (not prerendered); /api is proxied to the api on :8000 (prefix stripped)
pnpm dev:prod          # same, but proxied to the prod api (generate is rate-limited; PDFs land in the prod bucket)
pnpm lint
pnpm test              # Vitest: unit tests (jsdom) + Storybook stories in a Playwright browser
pnpm build             # vite build, prerender, tsc --noEmit
pnpm preview           # serves dist/ (prerendered, but without nginx's 404 handling)
pnpm storybook         # :6006
pnpm generate:api      # Orval → src/api/generated (never edit by hand)
pnpm og                # renders the og image
copier update --trust  # pull template changes; commit first
```

## Layout
- `src/routes/`: the pages, as file routes (`routeTree.gen.ts` is generated). `__root.tsx` holds the 404 route; each page renders `AppHeader` itself.
- `src/components/`: one folder per component with its stories, tests and single-use helpers, files named after it (no `index.tsx`, no barrels), grouped by feature (`cv/`). The stories' titles follow the folders. `ui/` (shadcn) stays flat, since the shadcn CLI expects it.
- `src/api/`: `fetcher.ts` (Orval's mutator: any non-2xx throws `ApiError {status, body}`, success bodies are zod-validated), `cv.ts` (hand-written wrappers) and the generated client in `generated/` (`cv` tag of the prod spec). Hand-written wrappers go outside `generated/`.
- `src/prerender.tsx` + `scripts/prerender.mjs`: prerendering. `src/router.tsx`: the router, shared by it and `main.tsx`.
- `Dockerfile` + `nginx.conf`: the site image. `Dockerfile.storybook` + `nginx.storybook.conf`: the Storybook image, which storybook-host composes. Deploys build both.

## Prerendering and 404s
`pnpm build` renders `/` and the not-found page into `dist/index.html` and `dist/404.html`.
- **Rendering must work in Node and match the browser's first render.** The editing layout can't touch `window` or `document` while rendering (effects are fine); the result layout can, since it's never prerendered. A render error fails the build on purpose.
- **A link with a selection hides the prerendered form** until the app replaces it (`data-cv-link`).
- **nginx serves only real files** (`try_files $uri $uri/ =404`): a route without a prerendered file in `scripts/prerender.mjs`'s `pages` is served `404.html` with a 404 status, though it still renders client-side.
- **Heads are static,** in `index.html`. `404.html`'s head is rewritten in `scripts/prerender.mjs`.
- **The site-transition head script** in `index.html` takes its names from shared-ui; `src/site-transition-head-script.test.ts` checks them.

## Rules
- **Installing needs a GitHub Packages token** for `@jakoblui-works/shared-ui`, even though it's public. CI uses `GITHUB_TOKEN`: shared-ui's package settings must give this repo read access ("Manage Actions access").
- **The header, theme tokens and fonts come from shared-ui;** `styles.css` holds only cv-web's palette and CSS. If `shadcn add` writes tokens into it, move the shared ones into shared-ui. A new site needs its entry in shared-ui's `sites.ts` first (`AppHeader`'s `current` is typed by it), with the same palette as `styles.css`.
- **Template files:** keep this repo's own additions at least one line away from template lines, or every template change to those lines conflicts on `copier update`. Don't edit `.copier-answers.yml` by hand. `README.md`, `CLAUDE.md`, `src/routes/index.tsx`, `src/components/app-header/app-header.tsx`, `src/components/not-found-page/not-found-page.tsx` and `public/sitemap.xml` are this repo's own after the first render; updates never touch them.
- **cv-web's own additions to template files:** `stringifySearch` and the Query devtools in `router.tsx`, the view-transition CSS in `styles.css`, the `og:image` lines and `#ffffff` `theme-color` in `index.html`, the `data-cv-link` script (with `main.tsx` and `styles.css`), the `og` script in `package.json`, the `surface` and disabled changes in `ui/button.tsx`, the `matchMedia` stub in `test-setup.ts`.
- **Repo-root `robots.txt`** is Storybook's (disallow all). The site's is `public/robots.txt`.
