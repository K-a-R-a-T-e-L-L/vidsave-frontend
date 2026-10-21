# VidSave frontend guidance

- Frontend Git root: `D:\Desktop\dev\web\orders\vidsave\vidsave-frontend`. Frontend и backend — отдельные репозитории; backend предназначен для NestJS/PostgreSQL. Не создавать backend или API внутри frontend и не изменять соседний backend/reference projects.
- Общая папка артефактов ChatGPT: `D:\Desktop\dev\web\orders\vidsave\.codex`. Она находится вне frontend Git root и Docker build context. Не создавать `vidsave-frontend/.codex` или отдельную backend `.codex`; каждый этап обновляет отчётные артефакты в общей папке, заменяя предыдущие.
- Не использовать Payload CMS. Stage 2.1R удаляет Payload integration; backend API и его PostgreSQL реализуются отдельно в backend repository.
- Публичные страницы находятся в `src/app/(frontend)` и сохраняют прежние URL. Опубликованные услуги и цены загружаются на сервере из NestJS через `BACKEND_INTERNAL_URL`; `src/app/lib/servicesList.ts` остаётся только snapshot-источником импортера и не должен становиться runtime fallback.
- Не менять дизайн, рекламные тексты, реальные контакты, цены, фотографии и юридические сведения без подтверждения владельца.
- Commands: `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm audit --omit=dev`. Docker build context — frontend root (`docker build .`); production uses Node 22 standalone output.
- Preserve existing dirty Git changes. No reset/clean/checkout bulk restore. Do not edit generated `.next/` output. Do not commit, push or deploy unless explicitly requested.
- Admin authentication is Next.js BFF over the independent NestJS backend. Browser code must never call NestJS directly or receive/store tokens in JS, HTML/RSC payloads, URLs, localStorage, or sessionStorage. Use only the HttpOnly cookies `vidsave_admin_access_token` and `vidsave_admin_refresh_token`; backend origin is the server-only `BACKEND_INTERNAL_URL`.
- Admin routes: `/admin/login`, protected `/admin`, `/admin/services`, `/admin/service-categories`; BFF auth and catalog endpoints live under `/api/admin/**`. Keep `/admin` noindex and out of the public sitemap. All protected server rendering must verify the profile with NestJS; distinguish 401 from backend-unavailable errors.
- Refresh is single-flight by SHA-256 refresh-token key in the current Node process. Compare-and-swap in NestJS remains authoritative. Deployment currently assumes exactly one frontend runtime instance; do not claim multi-instance coordination without a distributed mechanism. Stale/racing 401 responses must not clear a newer session cookie.
- Keep auth fetches no-store, bounded by timeout, and use fixed backend paths only. Mutating BFF routes require exact same-origin `Origin`; keep Next Server Actions' built-in CSRF checks enabled. Do not log credentials, tokens, or backend URLs.
- Stage 3.4 adds the admin service/category catalog and switches published public catalog pages, sitemap and YML to the backend. Stage 5 separately approves CMS, media, blog, portfolio, settings, leads and SEO; deployment remains outside scope.

- Stage 5 admin CMS uses src/shared/admin and the strict /api/admin/cms allowlist. New media URLs use the MediaImage custom loader and no-store /media route: verify publication before reading the bounded in-memory variant cache. Never pass private/public CMS media through the default Next optimizer cache. Static CMS content uses the shared page/provider primitives and validated Tiptap JSON rendering.

- Current owner-approved scope supersedes Stage 5 website editing: static page, SEO and media-library administration is removed; only contact settings remain. Keep business CRUD and inline uploads. Public copy and legal documents are source-managed; privacy/consent composition was explicitly authorized. Use server-rendered dynamic public content and automatically near-viewport-loaded 2GIS.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
