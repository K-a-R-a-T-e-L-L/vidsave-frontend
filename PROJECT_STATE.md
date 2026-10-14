# VidSave frontend repository reference

Canonical state: `D:\Desktop\dev\web\orders\vidsave\vidsave-backend\PROJECT_STATE.md`.
Canonical report: `D:\Desktop\dev\web\orders\vidsave\.codex\отчёт.txt`.

Frontend root: `D:\Desktop\dev\web\orders\vidsave\vidsave-frontend`. Related NestJS backend: `../vidsave-backend`. Next.js 16.4, React 19, Mantine 8, Tiptap 3, Manrope, SCSS, two themes, Node 22 standalone build.

Public routes are in `src/app/(frontend)`; administration in `src/app/(admin)`. CMS editor/shell/BFF helpers are in `src/shared/admin`; public content loaders/renderers in `src/app/lib/cms.ts` and `src/app/components/{CmsContent,RichContent,ContentListing,LeadForm}`. Tokens stay in existing HttpOnly sessions; strict BFF allowlists and Origin checks remain authoritative.

Only published records enter public lists/details/sitemap. Legacy `servicesList.ts` is importer input only. Media privacy uses no-store publication checks. Source-managed policy and separate consent enable leads. Admin settings edit contacts only; images upload inside content forms. 2GIS loads automatically near the viewport in both themes. The homepage alone changes its hero photograph by theme. FeedbackSection ends standard public pages; ContentCard is shared by the blog list and homepage.

Checks: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`, production/full npm audit, `docker build .`. Tests use disposable fixtures; generated Next declarations/output are excluded from formatting.

Preserve existing dirty changes and real business data. No automatic commit/push/deploy. Keep one shared state/report; do not maintain a separate frontend history.
