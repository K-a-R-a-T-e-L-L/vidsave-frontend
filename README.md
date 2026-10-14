# VidSave frontend

Next.js 16.4 / React 19 / Mantine 8 corporate website and CMS administration. The independent NestJS backend is `../vidsave-backend`. Canonical state: `../vidsave-backend/PROJECT_STATE.md`; report: `../.codex/отчёт.txt`.

## Local run

Use Node.js 22. Configure the server-only `BACKEND_INTERNAL_URL` in `.env` and start the backend with its own local PostgreSQL connection. Obtain the first administrator through the backend bootstrap command.

```powershell
npm ci
npm run dev
```

Public site: `http://localhost:3000`; admin login: `/admin/login`. Production checks: `npm run build`, `npm run start`, or `docker build -t vidsave-frontend .`. The production image builds without a live backend; server-rendered pages require the configured backend at runtime.

The production BFF trusts the canonical site origin by default. An explicit `FRONTEND_ORIGIN` can configure one trusted origin for a local production fixture or a different local port. It must match the backend setting. Canonicals remain `https://vidsave.karatell.ru`.

## Content management

Admin sections: overview, services/categories, blog/categories, portfolio, leads, contacts and administrators. Page, SEO and media-library routes return 404. Static website copy, layout, images and legal documents are maintained in source. Contact settings contain only contact details and map coordinates. Images upload directly inside content forms, including article text and project galleries.

Browser mutations use the existing BFF, exact Origin checks and HttpOnly cookies. Tokens never enter browser JavaScript or localStorage. Published blog, portfolio and service content is rendered on the server; request-scoped caching and parallel independent reads avoid duplicate work without delaying updates. Three original introductory guides are inserted only when missing. Empty portfolio sections never invent completed projects.

Lead forms submit to PostgreSQL through the BFF. Separate policy and consent documents are available at /privacy and /consent. The legal version changes with document content and contact email. The 2GIS company widget starts loading automatically within 700 px of the viewport and adapts to the site theme. Editor and notification styles stay in the admin layout.

Content URLs are assigned automatically when creating a record and retained on rename. Lists expose publication and confirmed deletion; occupied categories must first have their materials reassigned. Article images have selection controls for pixel width, description and removal; width adapts to narrow screens.

Uploads are validated and converted to WebP by backend Sharp (maximum 2400 px, quality 82). Public MediaImage uses Next responsive srcset and a custom /media loader (preview quality 75, detail 85). Variants are generated on demand, without extra stored thumbnail files. Each request rechecks publication before using a bounded 32 MiB/5 minute memory cache; responses stay no-store so withdrawn images cannot leak through the default Next image cache. Static assets retain the standard Next optimizer. ICO/PNG/Apple icons and web manifest are public; source brand assets use compressed WebP, social sharing uses JPEG.

## Checks

`npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`, `npm audit --omit=dev`, `npm audit`.

`npm test` includes isolated Next/API fixtures for SSR, metadata, service prices, filters, sitemap and YML. Environment-dependent auth tests require their explicit fixture variables. `npm run test:e2e` runs the simplified-admin browser fixture: retired routes, contact editing, inline uploads, publication and responsive themes. Install Chromium with `npx playwright install chromium`. `VIDSAVE_PLAYWRIGHT_MODULE` may point to an existing Playwright module. `VIDSAVE_PREBUILT_FRONTEND` can point to an isolated production build to avoid rebuilding the fixture. Tests must never target user data.

Older Stage 5 browser scripts remain historical diagnostics and are not the current test:e2e entry point.

Do not edit generated `.next/` or tsbuildinfo output. Keep credentials outside Git/build context. No commit, push or deployment is automatic.

Deployment setup: [DEPLOYMENT.md](DEPLOYMENT.md). Runtime template: `.env.production.example`. CI/CD is prepared locally; publishing is gated by repository variable `DEPLOY_ENABLED`.
