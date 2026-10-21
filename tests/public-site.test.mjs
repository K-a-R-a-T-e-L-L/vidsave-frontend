import sharp from 'sharp';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFile } from 'node:child_process';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const content = JSON.parse(await readFile('tests/fixtures/content-bootstrap.json', 'utf8'));
const fixture = JSON.parse((await readFile('tests/fixtures/catalog.json', 'utf8')).replace(/^\uFEFF/, ''));
const routes = ['/', '/services', '/for-home', '/for-business', '/projects', '/blog', '/about', '/contacts'];
const indexable = routes.filter((route) => !['/projects', '/blog'].includes(route));
const published = fixture.services.map((service) => ({ ...service, status: 'published' }));
// Never write to the real backend or database. Status filtering is exercised in this fixture.
const records = [
  ...published,
  { ...published[0], id: 'hidden-id', slug: 'fixture-hidden', status: 'hidden' },
  { ...published[0], id: 'draft-id', slug: 'fixture-draft', status: 'draft' },
];
const mediaId = 'c866042d-3ba0-432a-ae87-f245a2316811';
const mediaBytes = await sharp('public/images/design-preview/hero-light.webp')
  .resize(1200)
  .webp({ quality: 90 })
  .toBuffer();
const publicContent = { posts: [], projects: [], 'blog-categories': [] };
let mediaPublished = true;
let unavailable = false;
let frontend, backend, temp, origin;
const testProfile = { id: 'fixture-admin', email: 'simplify@example.test', role: 'ADMIN' };
const testAccess = [
  'e30',
  Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
  'fixture',
].join('.');
const contactKeys = [
  'phone',
  'additionalPhone',
  'email',
  'additionalEmail',
  'address',
  'geography',
  'hours',
  'latitude',
  'longitude',
  'telegram',
  'vk',
  'avito',
];
let adminContacts = Object.fromEntries(contactKeys.map((k) => [k, content.settings[k]]));
const adminPosts = new Map(),
  adminProjects = new Map(),
  adminMedia = new Map();
const pixel = await readFile('tests/fixtures/upload-32.png');
let runtimeOutput = '';
const mainFixturePids = [];

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}

test.before(async () => {
  backend = http.createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (unavailable) {
      res.writeHead(503);
      res.end('{"error":"fixture unavailable"}');
      return;
    }
    const url = new URL(req.url, 'http://fixture');
    const route = url.pathname;
    if (['POST', 'PATCH'].includes(req.method)) console.log('Fixture mutation received', req.method, route);
    if (route === '/api/admin/auth/login') {
      res.end(
        JSON.stringify({
          user: testProfile,
          accessToken: testAccess,
          refreshToken: 'a'.repeat(64),
          accessExpiresIn: 240,
          refreshExpiresIn: 3600,
        }),
      );
      return;
    }
    if (route.startsWith('/api/admin/')) {
      if (req.headers.authorization !== 'Bearer ' + testAccess) {
        res.statusCode = 401;
        res.end('{}');
        return;
      }
      let body;
      if (['POST', 'PATCH'].includes(req.method)) {
        let text = '';
        for await (const chunk of req) text += chunk;
        body = JSON.parse(text);
      }
      if (route === '/api/admin/auth/me') {
        res.end(JSON.stringify(testProfile));
        return;
      }
      if (route === '/api/admin/auth/logout') {
        res.statusCode = 204;
        res.end();
        return;
      }
      if (route === '/api/admin/cms/dashboard') {
        res.end(
          JSON.stringify({ services: 23, categories: 7, posts: 0, drafts: 0, projects: 0, leads: 0, recent: [] }),
        );
        return;
      }
      if (route === '/api/admin/cms/contacts') {
        if (req.method === 'PATCH') {
          assert.ok(Object.keys(body).every((k) => contactKeys.includes(k)));
          adminContacts = { ...adminContacts, ...body };
        }
        res.end(JSON.stringify(adminContacts));
        return;
      }
      if (route === '/api/admin/service-categories') {
        res.end(JSON.stringify({ items: fixture.categories }));
        return;
      }
      if (route === '/api/admin/services') {
        res.end(JSON.stringify({ items: fixture.services, total: 23 }));
        return;
      }
      if (route === '/api/admin/cms/blog-categories') {
        res.end(JSON.stringify({ items: [], total: 0 }));
        return;
      }
      if (route === '/api/admin/cms/media' && req.method === 'POST') {
        assert.equal(body.mime, 'image/png');
        assert.ok(Buffer.from(body.bytes, 'base64').length > 0);
        const id = randomUUID();
        const item = {
          id,
          title: body.title,
          alt: body.alt,
          width: 32,
          height: 32,
          previewUrl: '/api/admin/cms/media/' + id + '/file',
        };
        adminMedia.set(id, item);
        res.statusCode = 201;
        res.end(JSON.stringify(item));
        return;
      }
      const image = route.match(/^\/api\/admin\/cms\/media\/([^/]+)\/file$/);
      if (image) {
        res.setHeader('content-type', 'image/png');
        res.end(pixel);
        return;
      }
      const deleting = route.match(/^\/api\/admin\/cms\/media\/([^/]+)$/);
      if (deleting && req.method === 'DELETE') {
        const used = [...adminPosts.values(), ...adminProjects.values()].some((item) =>
          JSON.stringify(item).includes(deleting[1]),
        );
        if (used) res.statusCode = 409;
        else adminMedia.delete(deleting[1]);
        res.end('{}');
        return;
      }
      const record = route.match(/^\/api\/admin\/cms\/(posts|projects)(?:\/([^/]+))?$/);
      if (record) {
        const repo = record[1] === 'posts' ? adminPosts : adminProjects;
        let item;
        if (req.method === 'POST' || req.method === 'PATCH') {
          const id = record[2] || randomUUID();
          item = {
            ...repo.get(id),
            ...body,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: null,
          };
          repo.set(id, item);
          if (req.method === 'POST') res.statusCode = 201;
        } else if (req.method === 'DELETE') {
          repo.delete(record[2]);
          item = { deleted: true };
        } else item = record[2] ? repo.get(record[2]) : { items: [...repo.values()], total: repo.size };
        res.end(JSON.stringify(item));
        return;
      }
      res.statusCode = 404;
      res.end('{}');
      return;
    }
    if (url.pathname === '/api/content/media/' + mediaId) {
      if (!mediaPublished) {
        res.writeHead(404);
        res.end('{}');
        return;
      }
      res.setHeader('content-type', 'image/webp');
      res.end(mediaBytes);
      return;
    }
    if (url.pathname === '/api/content/bootstrap')
      res.end(JSON.stringify({ ...content, pages: [], settings: { ...content.settings, ...adminContacts } }));
    else if (/^\/api\/content\/(posts|projects|blog-categories)(?:\/[^/]+)?$/.test(url.pathname)) {
      const [, , , kind, slug] = url.pathname.split('/');
      const items = publicContent[kind].filter((item) => item.status === 'published');
      if (slug) {
        const item = items.find((item) => item.slug === decodeURIComponent(slug));
        res.statusCode = item ? 200 : 404;
        res.end(JSON.stringify(item ?? {}));
      } else {
        const limit = Number(url.searchParams.get('limit') || 12);
        const current = Number(url.searchParams.get('page') || 1);
        res.end(
          JSON.stringify({
            items: items.slice((current - 1) * limit, current * limit),
            total: items.length,
            page: current,
            limit,
          }),
        );
      }
    } else if (url.pathname === '/api/content/lead-config') res.end(JSON.stringify({ enabled: false }));
    else if (url.pathname === '/api/catalog/categories') res.end(JSON.stringify({ items: fixture.categories }));
    else if (url.pathname === '/api/catalog/services') {
      const items = records
        .filter((record) => record.status === 'published')
        .map(({ status: _status, ...record }) => record);
      res.end(JSON.stringify({ items, total: items.length, page: 1, limit: 100 }));
    } else {
      res.writeHead(404);
      res.end('{}');
    }
  });
  const backendPort = await listen(backend);
  const reservation = http.createServer();
  const frontendPort = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  // Webpack cannot resolve a linked Next package across Windows drive letters.
  // Keep the small temporary app on the same drive; never copy node_modules.
  temp = await mkdtemp(path.join(process.platform === 'win32' ? process.cwd() : os.tmpdir(), '.vidsave-stage41-test-'));
  for (const item of ['src', 'public', 'package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.cjs']) {
    await cp(item, path.join(temp, item), { recursive: true });
  }
  await symlink(
    path.join(process.cwd(), 'node_modules'),
    path.join(temp, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  // Avoid loading the user's .env; the temporary application has only the fixture URL.
  await writeFile(path.join(temp, '.env.local'), '', 'utf8');
  const appDirectory = process.env.VIDSAVE_PREBUILT_FRONTEND || temp;
  frontend = spawn(
    process.execPath,
    [
      path.join(process.cwd(), 'node_modules/next/dist/bin/next'),
      ...(process.env.VIDSAVE_PREBUILT_FRONTEND ? ['start'] : ['dev', '--webpack']),
      '--hostname',
      '127.0.0.1',
      '--port',
      String(frontendPort),
    ],
    {
      cwd: appDirectory,
      env: {
        ...process.env,
        NODE_ENV: process.env.VIDSAVE_PREBUILT_FRONTEND ? 'production' : 'development',
        FRONTEND_ORIGIN: `http://localhost:${frontendPort}`,
        BACKEND_INTERNAL_URL: `http://127.0.0.1:${backendPort}`,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  mainFixturePids.push(frontend.pid);
  frontend.stdout.on('data', (data) => {
    runtimeOutput += data;
  });
  frontend.stderr.on('data', (data) => {
    runtimeOutput += data;
  });
  origin = `http://localhost:${frontendPort}`;
  console.log(
    `Isolated fixture: Next PID ${frontend.pid}, port ${frontendPort}; API port ${backendPort}, owner PID ${process.pid}`,
  );
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (frontend.exitCode !== null) throw new Error(runtimeOutput);
    try {
      const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next fixture did not start: ${runtimeOutput}`);
});

test.after(async () => {
  if (frontend && frontend.exitCode === null) {
    const closed = new Promise((resolve) => frontend.once('exit', resolve));
    if (process.platform === 'win32') {
      await new Promise((resolve) => execFile('taskkill', ['/PID', String(frontend.pid), '/T', '/F'], resolve));
    } else frontend.kill('SIGTERM');
    await Promise.race([closed, new Promise((resolve) => setTimeout(resolve, 10000))]);
    if (frontend.exitCode === null) {
      frontend.kill('SIGKILL');
      await closed;
    }
  }
  if (backend) await new Promise((resolve) => backend.close(resolve));
  if (temp) await rm(temp, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  console.log(`Fixture cleaned up; owned Next PIDs: ${mainFixturePids.join(', ')}`);
});

async function page(route, expected = 200) {
  const response = await fetch(`${origin}${route}`, {
    headers: { 'user-agent': 'Googlebot' },
    redirect: 'manual',
    signal: AbortSignal.timeout(120000),
  });
  const html = await response.text();
  assert.equal(response.status, expected, `${route}: ${runtimeOutput.slice(0, 6000)} ${runtimeOutput.slice(-1000)}`);
  return html;
}
function attribute(html, name) {
  return html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];
}

test('all sections have one server-rendered H1, distinct metadata and canonical; navigation links are real routes', async () => {
  const titles = [],
    descriptions = [];
  for (const route of routes) {
    const html = await page(route);
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, route);
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    assert.equal(new URL(canonical).href, `https://vidsave.karatell.ru${route === '/' ? '/' : route}`);
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta name="twitter:card"/);
    for (const target of routes.slice(1)) assert.ok(html.includes(`href="${target}"`), `${route} links to ${target}`);
    assert.doesNotMatch(html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '', /href="(?:\/)?#(?!request")/);
    assert.equal((html.match(/id="request"/g) ?? []).length, 1, route + ' has one final feedback section');
    if (indexable.includes(route)) {
      titles.push(html.match(/<title>([^<]*)/)[1]);
      descriptions.push(attribute(html, 'description'));
      assert.equal(attribute(html, 'robots'), 'index, follow, max-image-preview:large');
    } else assert.equal(attribute(html, 'robots'), 'noindex, follow, max-image-preview:large');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) =>
      JSON.parse(match[1]),
    );
    assert.equal(schemas.filter((schema) => schema['@type'] === 'LocalBusiness').length, 1);
    assert.equal(schemas.filter((schema) => schema['@type'] === 'BreadcrumbList').length, route === '/' ? 0 : 1);
  }
  assert.equal(new Set(titles).size, indexable.length);
  assert.equal(new Set(descriptions).size, indexable.length);
});

test('all 23 existing service URLs and prices survive; hidden, draft and unknown slugs return 404', async () => {
  assert.equal(published.length, 23);
  const catalog = await page('/services');
  for (const service of published) {
    assert.ok(catalog.includes(`/services/${service.slug}`));
    const html = await page(`/services/${service.slug}`);
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.ok(html.includes(`href="https://vidsave.karatell.ru/services/${service.slug}"`));
    assert.ok(html.includes(service.imagePath));
    assert.ok(html.includes('Описание услуги'));
    const amount = service.priceRub.split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    assert.ok(
      html.includes(`${service.priceMode === 'from' ? 'от ' : ''}${amount} ₽ / ${service.unitLabel}`),
      service.slug,
    );
    const schema = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
      .find((item) => item['@type'] === 'Service');
    assert.equal(schema.name, service.name);
    assert.equal(schema.description, service.description);
    if (service.priceMode === 'fixed') {
      assert.equal(schema.offers.price, service.priceRub);
      assert.equal(schema.offers.priceCurrency, 'RUB');
    } else assert.equal(schema.offers, undefined, 'A starting price must not be presented as a fixed offer');
  }
  for (const slug of ['fixture-hidden', 'fixture-draft', 'not-an-existing-service']) {
    assert.ok(!catalog.includes(`/services/${slug}`));
    await page(`/services/${slug}`, 404);
  }
});

test('public HTML preloads fonts and static images cache without exposing CMS media', async () => {
  const response = await fetch(origin + '/');
  const html = await response.text();
  // React may emit resource hints in the HTTP Link header instead of HTML.
  const hints = (response.headers.get('link') ?? '') + html;
  assert.equal(new Set(hints.match(/[^\s<>";,]+\.woff2/g) ?? []).size, 2);
  assert.match(html, /max-image-preview:large/);
  const image = await fetch(`${origin}/images/brand/logo-light.webp`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('cache-control'), /max-age=86400/);
  const api = await fetch(`${origin}/api/admin/me`);
  assert.match(api.headers.get('x-robots-tag'), /noindex/);
});

test('seven category filters work in server HTML and use an unfiltered canonical', async () => {
  assert.equal(fixture.categories.length, 7);
  for (const category of fixture.categories) {
    const html = await page(`/services?category=${category.slug}`);
    assert.equal(attribute(html, 'robots'), 'noindex, follow, max-image-preview:large');
    assert.ok(html.includes('<link rel="canonical" href="https://vidsave.karatell.ru/services"'));
    for (const service of published)
      assert.equal(html.includes(`/services/${service.slug}`), service.category.id === category.id);
  }
  const fallback = await page('/services?category=unknown');
  assert.ok(fallback.includes('Категория не найдена'));
});

test('sitemap, robots and YML retain public semantics and omit empty sections and private routes', async () => {
  const sitemap = await page('/sitemap.xml');
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 29);
  for (const route of indexable.slice(1)) assert.ok(sitemap.includes(`https://vidsave.karatell.ru${route}<`));
  assert.doesNotMatch(sitemap, /\/blog|\/projects|\/admin|\/api|\?category|fixture-hidden|fixture-draft/);
  const robots = await page('/robots.txt');
  assert.match(robots, /Sitemap: https:\/\/vidsave.karatell.ru\/sitemap.xml/);
  assert.doesNotMatch(robots, /Disallow:\s*\/(blog|projects)/);
  const feed = await page('/feed/services');
  assert.equal((feed.match(/<offer id=/g) ?? []).length, 23);
  assert.ok(feed.includes(`<email>${content.settings.email}</email>`));
  assert.ok(feed.includes(`<company>${content.settings.companyName}</company>`));
  assert.ok(feed.includes(`<param name="Регион">${content.settings.geography}</param>`));
  assert.doesNotMatch(feed, /Годы опыта|Конверсия|Рейтинг|Число отзывов/);
  for (const service of published) {
    assert.ok(feed.includes(`<offer id="${service.legacyId}">`));
    assert.ok(feed.includes(`<price>${service.priceRub}</price>`));
    assert.ok(feed.includes(`/services/${encodeURIComponent(service.slug)}`));
  }
});

test('anonymous admin and BFF stay protected without changing the authentication implementation', async () => {
  await page('/admin/login');
  const admin = await fetch(`${origin}/admin`, { redirect: 'manual' });
  assert.ok([302, 307].includes(admin.status));
  assert.match(admin.headers.get('location'), /\/admin\/login/);
  for (const route of ['/api/admin/me', '/api/admin/services', '/api/admin/service-categories']) await page(route, 401);
});

test('catalog-dependent routes and feeds fail visibly when API is unavailable', async () => {
  unavailable = true;
  try {
    for (const route of [
      '/',
      '/services',
      '/for-home',
      '/for-business',
      `/services/${published[0].slug}`,
      '/sitemap.xml',
      '/feed/services',
    ]) {
      await page(route, 500);
    }
  } finally {
    unavailable = false;
  }
});

test(
  'simplified admin: retired routes, contact-only settings and inline image uploads',
  { skip: process.env.VIDSAVE_ADMIN_BROWSER_TESTS !== '1', timeout: 360000 },
  async () => {
    const module = process.env.VIDSAVE_PLAYWRIGHT_MODULE
      ? pathToFileURL(process.env.VIDSAVE_PLAYWRIGHT_MODULE).href
      : '@playwright/test';
    const { chromium } = await import(module);
    const browser = await chromium.launch({ headless: false });
    const cdp = await browser.newBrowserCDPSession();
    console.log('Simplified browser PIDs', JSON.stringify((await cdp.send('SystemInfo.getProcessInfo')).processInfo));
    await cdp.detach();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    context.setDefaultNavigationTimeout(120000);
    context.setDefaultTimeout(60000);
    const screenshots = await mkdtemp(path.join(os.tmpdir(), 'vidsave-simplify-browser-'));
    await context.route('**/*', (r) => (new URL(r.request().url()).origin === origin ? r.continue() : r.abort()));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await page.goto(origin + '/admin/login', { waitUntil: 'networkidle' });
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill(testProfile.email);
      await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill('Fixture-password-12345');
      await page.getByRole('button', { name: 'Войти', exact: true }).click();
      await page.waitForURL(origin + '/admin');
      for (const label of ['Страницы сайта', 'Медиа', 'SEO'])
        assert.equal(await page.getByRole('link', { name: label, exact: true }).count(), 0);
      for (const route of ['/admin/pages', '/admin/pages/home', '/admin/media', '/admin/seo'])
        assert.equal((await context.request.get(origin + route)).status(), 404);
      for (const route of ['pages', 'settings', 'seo', 'media'])
        assert.equal((await context.request.get(origin + '/api/admin/cms/' + route)).status(), 404);
      await page.goto(origin + '/admin/settings', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').innerText(), 'Контактные данные');
      assert.equal(await page.locator('input[type=file]').count(), 0);
      assert.equal(await page.locator('.tiptap').count(), 0);
      await page.getByRole('textbox', { name: 'Основной телефон', exact: true }).fill('8-900-777-66-55');
      const contactSave = page.waitForResponse(
        (r) =>
          r.request().method() === 'PATCH' &&
          new URL(r.url()).pathname.replace(/\/$/, '') === '/api/admin/cms/contacts',
      );
      await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
      const savedContacts = await contactSave;
      console.log('Contact save HTTP', savedContacts.status());
      assert.equal(savedContacts.status(), 200, 'Contact save HTTP status');
      await page.getByText('Изменения сохранены', { exact: true }).waitFor();
      assert.equal(adminContacts.phone, '8-900-777-66-55');
      await page.goto(origin + '/contacts', { waitUntil: 'networkidle' });
      assert.ok(await page.locator('a[href="tel:+79007776655"]').count());
      await page.setViewportSize({ width: 375, height: 200 });
      await page.goto(origin + '/contacts', { waitUntil: 'networkidle' });
      const mapRoute = page.getByRole('link', { name: 'Построить маршрут в 2ГИС ↗' });
      assert.equal(await page.locator('iframe').count(), 0, 'Distant map does not load on arrival');
      await mapRoute.scrollIntoViewIfNeeded();
      await page.locator('iframe[src^="https://widgets.2gis.com/"]').waitFor();
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const kind of ['blog', 'projects']) {
        await page.goto(origin + '/admin/' + kind + '/new', { waitUntil: 'networkidle' });
        await page.getByRole('textbox', { name: 'Заголовок', exact: true }).fill('Запись из браузера ' + kind);
        assert.equal(await page.getByRole('textbox', { name: 'Адрес страницы', exact: true }).count(), 0);
        await page.getByRole('textbox', { name: 'Краткое описание', exact: true }).fill('Описание тестовой записи');
        if (kind === 'blog') {
          await page.locator('.tiptap').fill('Содержимое тестовой статьи');
          await page.getByRole('button', { name: 'Заголовок 2', exact: true }).click();
          assert.equal(await page.locator('.tiptap h2').innerText(), 'Содержимое тестовой статьи');
          await page.getByRole('button', { name: 'Жирный', exact: true }).click();
          await page.locator('.tiptap').press('End');
          await page.locator('.tiptap').pressSequentially(' — выделение');
          assert.ok(await page.locator('.tiptap strong').count());
          await page.locator('input[type=file]').nth(1).setInputFiles(path.resolve('tests/fixtures/upload-16.png'));
          await page.waitForFunction(() => !document.querySelector('[data-media-uploading="true"]'));
          assert.equal(await page.locator('.tiptap img').count(), 1);
          await page.locator('.tiptap img').click();
          await page.getByRole('button', { name: 'Маленькое', exact: true }).click();
          assert.equal(await page.locator('.tiptap img').getAttribute('width'), '320');
          await page.getByRole('textbox', { name: 'Описание изображения', exact: true }).fill('Камера на объекте');
          await page.getByRole('button', { name: 'Удалить изображение из текста', exact: true }).click();
          assert.equal(await page.locator('.tiptap img').count(), 0);
          await page.getByRole('button', { name: 'Отменить', exact: true }).click();
          assert.equal(await page.locator('.tiptap img').count(), 1);
        }
        const input = page.locator('input[type=file]').nth(0);
        await input.setInputFiles(path.resolve('tests/fixtures/upload-32.png'));
        await page.getByRole('button', { name: 'Сохранить', exact: true }).waitFor({ state: 'visible' });
        await page.waitForFunction(() => !document.querySelector('[data-media-uploading="true"]'));
        assert.equal(await page.getByRole('dialog').count(), 0);
        if (kind === 'blog') {
          await page.getByRole('button', { name: 'Предпросмотр', exact: true }).click();
          const preview = page.getByRole('dialog');
          assert.ok(await preview.getByRole('heading', { name: /Содержимое тестовой статьи/ }).count());
          assert.equal(await preview.locator('img').count(), 2, 'Cover and inline image in preview');
          await preview.getByRole('button', { name: 'Закрыть', exact: true }).click();
        }
        await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
        await page.waitForURL((url) => !url.pathname.endsWith('/new'));
        const repo = kind === 'blog' ? adminPosts : adminProjects;
        const item = [...repo.values()][0];
        assert.ok(adminMedia.has(item.coverId));
        assert.match(item.slug, /^zapis-iz-brauzera-/);
        const savedSlug = item.slug;
        await page.getByRole('textbox', { name: 'Заголовок', exact: true }).fill('Новое название');
        await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('button[data-loading]'));
        assert.equal(repo.get(item.id).slug, savedSlug);
        if (kind === 'projects') {
          await page.locator('input[type=file]').nth(1).setInputFiles(path.resolve('tests/fixtures/upload-16.png'));
          await page.waitForFunction(() => !document.querySelector('[data-media-uploading="true"]'));
          await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
          await page.getByText('Изменения сохранены', { exact: true }).last().waitFor();
          assert.equal([...adminProjects.values()][0].galleryIds.length, 1);
        }
      }
      await page.goto(origin + '/admin/blog', { waitUntil: 'networkidle' });
      await page.locator('table').getByRole('button', { name: 'Опубликовать', exact: true }).click();
      await page.locator('table').getByRole('button', { name: 'Скрыть', exact: true }).waitFor();
      assert.equal([...adminPosts.values()][0].status, 'published');
      await page.locator('table').getByRole('button', { name: 'Скрыть', exact: true }).click();
      await page.locator('table').getByRole('button', { name: 'Опубликовать', exact: true }).waitFor();
      assert.equal([...adminPosts.values()][0].status, 'archived');
      await page.locator('table').getByRole('button', { name: 'Удалить', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Удалить', exact: true }).click();
      await page.getByText(/Записей пока нет/).waitFor();
      assert.equal(adminPosts.size, 0);
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(origin + '/admin/settings', { waitUntil: 'networkidle' });
        for (const theme of ['light', 'dark']) {
          if ((await page.locator('html').getAttribute('data-mantine-color-scheme')) !== theme)
            await page.getByRole('button', { name: 'Переключить цветовую тему', exact: true }).click();
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          // Reproduce slow render-blocking styles: hero discovery must not wait for them.
          await page.route('**/*.css', async (route) => {
            const response = await route.fetch();
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await route.fulfill({ response });
          });
          await page.goto(origin + '/', { waitUntil: 'networkidle' });
          await page.unroute('**/*.css');
          const earlyHero = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            const hero = resources.find((entry) => /\/hero-(light|dark)-\d+\.avif/.test(entry.name));
            const styles = resources.filter((entry) => entry.name.endsWith('.css'));
            return { start: hero?.startTime, cssEnd: Math.min(...styles.map((entry) => entry.responseEnd)) };
          });
          assert.ok(earlyHero.start < earlyHero.cssEnd, 'Hero starts before blocking CSS completes');
          console.log('CSS-independent hero', width, theme, earlyHero);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          const expectedHero = `/images/home-v2/hero-${theme}-${width <= 960 ? '960' : '1920'}.avif`;
          assert.equal(
            await page.locator('link[rel="preload"][as="image"][type="image/avif"]').getAttribute('href'),
            expectedHero,
          );
          const heroRequests = await page.evaluate(() =>
            performance
              .getEntriesByType('resource')
              .filter((entry) => /\/hero-(light|dark)-\d+\.avif/.test(entry.name))
              .map((entry) => entry.name),
          );
          assert.equal(heroRequests.length, 1, 'Only the visible theme and viewport hero should download');
          assert.ok(heroRequests[0].endsWith(expectedHero));
          const cssBytes = await page.evaluate(() =>
            performance
              .getEntriesByType('resource')
              .filter((entry) => entry.name.includes('/_next/') && entry.name.endsWith('.css'))
              .reduce((sum, entry) => sum + entry.decodedBodySize, 0),
          );
          assert.ok(cssBytes > 0 && cssBytes < 150_000, `Public CSS budget exceeded: ${cssBytes}`);
          console.log('Public CSS bytes', width, theme, cssBytes);
          if (width === 375) {
            await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
            const drawer = page.getByRole('dialog');
            await drawer.waitFor();
            const box = await drawer.boundingBox();
            assert.ok(box.width > 250 && box.width <= width, 'Mobile drawer remains sized to viewport');
            await page.keyboard.press('Escape');
            await drawer.waitFor({ state: 'hidden' });
          }
          if (process.env.VIDSAVE_AXE_SCRIPT) {
            await page.addScriptTag({ content: await readFile(process.env.VIDSAVE_AXE_SCRIPT, 'utf8') });
            const audit = await page.evaluate(async () => {
              const result = await window.axe.run(document, { runOnly: ['color-contrast'] });
              return result.violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
              }));
            });
            assert.deepEqual(audit, [], 'Contrast: ' + width + '/' + theme);
          }
          console.log(
            'Hero timing',
            width,
            theme,
            await page.evaluate(() => {
              const nav = performance.getEntriesByType('navigation')[0];
              const image = performance
                .getEntriesByType('resource')
                .find((r) => /hero-(light|dark)-\d+\.avif/.test(r.name));
              return { discoveryAfterFirstByte: image?.startTime - nav.responseStart };
            }),
          );
          await page.screenshot({
            path: path.join(screenshots, 'home-' + width + '-' + theme + '.png'),
            fullPage: true,
          });
          await page.goto(origin + '/admin/settings', { waitUntil: 'networkidle' });
        }
      }
      assert.deepEqual(errors, []);
      console.log('Inline uploads/contact editing/removed sections/themes browser PASS');
      console.log('Browser screenshots', screenshots);
    } catch (e) {
      console.log('Next fixture diagnostics', runtimeOutput.slice(-12000));
      throw e;
    } finally {
      await context.close();
      await browser.close();
      console.log('Simplified browser closed');
    }
  },
);

test('responsive media is smaller, bounded, and withdrawn images remain private after caching', async () => {
  const original = await fetch(origin + '/media/' + mediaId);
  assert.equal(original.status, 200);
  const full = Buffer.from(await original.arrayBuffer());
  const url = origin + '/media/' + mediaId + '?w=384&q=75';
  const resized = await fetch(url);
  assert.equal(resized.status, 200);
  assert.equal(resized.headers.get('cache-control'), 'no-store');
  const bytes = Buffer.from(await resized.arrayBuffer());
  assert.equal((await sharp(bytes).metadata()).width, 384);
  assert.ok(bytes.length < full.length * 0.6);
  assert.deepEqual(Buffer.from(await (await fetch(url)).arrayBuffer()), bytes);
  for (const query of ['?w=99999&q=75', '?w=384&q=1', '?q=75', '?w=384&w=640', '?w=384&file=secret'])
    assert.equal((await fetch(origin + '/media/' + mediaId + query)).status, 400);
  mediaPublished = false;
  try {
    assert.equal((await fetch(url)).status, 404);
    assert.equal((await fetch(origin + '/media/' + mediaId)).status, 404);
  } finally {
    mediaPublished = true;
  }
  assert.equal(
    (await fetch(origin + '/_next/image?url=' + encodeURIComponent('/media/' + mediaId) + '&w=384&q=75')).status,
    400,
  );
  console.log('Media byte comparison', full.length, '->', bytes.length);
});
test('brand icons and web manifest have valid public assets', async () => {
  for (const [file, size] of [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['favicon-96x96.png', 96],
    ['apple-touch-icon.png', 180],
    ['web-app-manifest-192x192.png', 192],
    ['web-app-manifest-512x512.png', 512],
  ]) {
    const r = await fetch(origin + '/' + file);
    assert.equal(r.status, 200);
    const meta = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
  }
  assert.equal((await fetch(origin + '/favicon.ico')).status, 200);
  const manifest = await (await fetch(origin + '/site.webmanifest')).json();
  assert.equal(manifest.name, 'ВИДЕОХРАНИТЕЛЬ');
  assert.equal(manifest.icons.length, 2);
  const html = await page('/');
  assert.match(html, /rel="icon"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /rel="manifest"/);
  assert.match(html, /images\/brand\/mark.webp/);
  assert.match(html, /images\/brand\/social.jpg/);
});

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1]),
  );
}
test('FAQ schema matches rendered answers and contact address follows current settings', async () => {
  for (const route of ['/', '/for-home', '/for-business']) {
    const html = await page(route);
    const faq = jsonLd(html).find((item) => item['@type'] === 'FAQPage');
    assert.ok(faq?.mainEntity.length, route);
    for (const item of faq.mainEntity) {
      assert.equal(item['@type'], 'Question');
      assert.equal(item.acceptedAnswer['@type'], 'Answer');
      // Exclude JSON-LD and RSC scripts: answers must exist in visible/expandable HTML too.
      const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');
      assert.ok(visible.includes(item.name), route + ' question');
      assert.ok(visible.includes(item.acceptedAnswer.text), route + ' answer');
    }
  }
  const original = adminContacts.address;
  try {
    adminContacts.address = 'Россия, 650000, г. Проверочный, ул. Новая, д. 2';
    const business = jsonLd(await page('/')).find((item) => item['@type'] === 'LocalBusiness');
    assert.equal(business.address.addressCountry, 'RU');
    assert.equal(business.address.addressLocality, 'Проверочный');
    assert.equal(business.address.streetAddress, 'ул. Новая, д. 2');
    assert.equal(business.address.postalCode, '650000');
    assert.equal(business.priceRange, undefined);
    adminContacts.address = 'Адрес уточняется';
    const changed = jsonLd(await page('/')).find((item) => item['@type'] === 'LocalBusiness');
    assert.deepEqual(changed.address, { '@type': 'PostalAddress', name: 'Адрес уточняется' });
  } finally {
    adminContacts.address = original;
  }
});
test('new service schemas use live prices and disappear after withdrawal', async () => {
  const service = {
    ...published[0],
    id: 'future-service',
    legacyId: null,
    slug: 'future-service',
    name: 'Новая услуга',
    priceMode: 'fixed',
    priceRub: '1250.50',
    status: 'published',
  };
  records.push(service);
  try {
    for (const mode of ['fixed', 'from', 'on_request']) {
      service.priceMode = mode;
      const schema = jsonLd(await page('/services/future-service')).find((item) => item['@type'] === 'Service');
      assert.equal(schema.name, service.name);
      assert.equal(schema.url, 'https://vidsave.karatell.ru/services/future-service');
      assert.equal(schema.provider['@id'], 'https://vidsave.karatell.ru/#business');
      assert.ok(schema.image.startsWith('https://'));
      if (mode === 'fixed') {
        assert.equal(schema.offers.price, '1250.50');
        assert.equal(schema.offers.priceCurrency, 'RUB');
      } else assert.equal(schema.offers, undefined);
    }
    service.priceMode = 'fixed';
    service.priceRub = null;
    assert.equal(
      jsonLd(await page('/services/future-service')).find((item) => item['@type'] === 'Service').offers,
      undefined,
    );
    service.status = 'hidden';
    await page('/services/future-service', 404);
    assert.ok(!(await page('/sitemap.xml')).includes('future-service'));
  } finally {
    records.splice(records.indexOf(service), 1);
  }
});
test('new blog and portfolio schemas follow publication, edits, media and deletion', async () => {
  const title = 'Новая запись </script><script>alert(1)</script>';
  for (const [kind, route, type] of [
    ['posts', '/blog', 'BlogPosting'],
    ['projects', '/projects', 'CreativeWork'],
  ]) {
    const item = {
      id: 'future-' + kind,
      slug: 'future-' + kind,
      title,
      excerpt: 'Описание',
      status: 'draft',
      seoTitle: null,
      seoDescription: null,
      coverId: mediaId,
      coverUrl: '/media/' + mediaId,
      ogImageUrl: null,
      body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Содержимое записи' }] }] },
      categories: [],
      services: [published[0]],
      galleryIds: [mediaId],
      publishedAt: '2026-10-01T10:00:00.000Z',
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T11:00:00.000Z',
    };
    if (kind === 'posts') {
      const paragraph = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
      const cell = (type, text, attrs = {}) => ({ type, attrs, content: [paragraph(text)] });
      item.body = {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Раздел статьи' }] },
          {
            type: 'orderedList',
            attrs: { start: 5 },
            content: [{ type: 'listItem', content: [paragraph('Пятый пункт')] }],
          },
          {
            type: 'table',
            content: [
              { type: 'tableRow', content: [cell('tableHeader', 'Услуга'), cell('tableHeader', 'Цена')] },
              { type: 'tableRow', content: [cell('tableCell', 'Монтаж'), cell('tableCell', '100')] },
            ],
          },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [cell('tableHeader', 'Общий заголовок', { rowspan: 2 }), cell('tableHeader', 'Колонка')],
              },
              { type: 'tableRow', content: [cell('tableCell', 'Значение')] },
            ],
          },
        ],
      };
    }
    publicContent[kind].push(item);
    const url = route + '/' + item.slug;
    try {
      await page(url, 404);
      item.status = 'published';
      const html = await page(url);
      const schema = jsonLd(html).find((entry) => entry['@type'] === type);
      assert.equal(schema.headline || schema.name, title);
      assert.equal(schema.datePublished, item.publishedAt);
      assert.equal(schema.dateModified, item.updatedAt);
      assert.equal(schema.url, 'https://vidsave.karatell.ru' + url);
      assert.ok(JSON.stringify(schema.image).includes('https://vidsave.karatell.ru/media/'));
      assert.ok(!html.includes('<script>alert(1)</script>'));
      if (kind === 'posts') {
        const article = html.match(/<article>([\s\S]*?)<\/article>/)?.[1];
        assert.ok(article, 'Blog content has an article landmark');
        assert.equal((article.match(/<h1[ >]/g) || []).length, 1);
        assert.ok(article.includes('<time dateTime=') || article.includes('<time datetime='));
        assert.match(article, /<h2><span>Раздел статьи<\/span><\/h2>/);
        assert.match(article, /<ol start="5">/);
        assert.match(article, /<thead><tr><th scope="col">/);
        assert.match(article, /<\/thead><tbody><tr><td>/);
        assert.match(article, /<table><tbody><tr><th rowSpan="2">/i);
        assert.ok(!article.includes('Другие материалы'));
        assert.ok(!article.includes('id="request"'));
      }
      const crumbs = jsonLd(html).find((entry) => entry['@type'] === 'BreadcrumbList');
      assert.equal(crumbs.itemListElement.at(-1).item, schema.url);
      const list = jsonLd(await page(route)).find((entry) => entry['@type'] === 'ItemList');
      assert.equal(list.itemListElement[0].url, schema.url);
      assert.ok((await page('/sitemap.xml')).includes(item.slug));
      item.title = 'Обновлено';
      item.updatedAt = '2026-10-03T11:00:00.000Z';
      const updated = jsonLd(await page(url)).find((entry) => entry['@type'] === type);
      assert.equal(updated.headline || updated.name, 'Обновлено');
      assert.equal(updated.dateModified, item.updatedAt);
      item.status = 'archived';
      await page(url, 404);
      assert.ok(!(await page('/sitemap.xml')).includes(item.slug));
    } finally {
      publicContent[kind].splice(publicContent[kind].indexOf(item), 1);
    }
    await page(url, 404);
  }
});

test('static preview optimization reduces transferred bytes without changing dimensions', async () => {
  for (const name of ['preview-home', 'preview-business']) {
    const request = async (q) => {
      const response = await fetch(
        origin + '/_next/image?url=' + encodeURIComponent('/images/media-pack/' + name + '.webp') + '&w=640&q=' + q,
        { headers: { accept: 'image/webp' } },
      );
      assert.equal(response.status, 200);
      return Buffer.from(await response.arrayBuffer());
    };
    const before = await request(75),
      after = await request(60);
    assert.equal((await sharp(after).metadata()).width, (await sharp(before).metadata()).width);
    assert.ok(after.length < before.length * 0.9, name + ': ' + before.length + ' -> ' + after.length);
    console.log('Preview bytes', name, before.length, '->', after.length);
  }
});

test(
  'home redesign: responsive themes, navigation, semantics and image budget',
  { skip: process.env.VIDSAVE_HOME_BROWSER_TESTS !== '1', timeout: 240000 },
  async () => {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: false });
    const cdp = await browser.newBrowserCDPSession();
    console.log('Home browser PIDs', JSON.stringify((await cdp.send('SystemInfo.getProcessInfo')).processInfo));
    await cdp.detach();
    const screenshots = await mkdtemp(path.join(os.tmpdir(), 'vidsave-home-redesign-'));
    try {
      for (const width of [1280, 390, 768, 320])
        for (const theme of ['light', 'dark']) {
          const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 760 : 1000 } });
          await context.addInitScript((theme) => {
            localStorage.setItem('vidsave_theme', theme);
            window.__homeMetrics = { cls: 0, lcp: 0 };
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) if (!e.hadRecentInput) window.__homeMetrics.cls += e.value;
            }).observe({ type: 'layout-shift', buffered: true });
            new PerformanceObserver((list) => {
              window.__homeMetrics.lcp = list.getEntries().at(-1)?.startTime || 0;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          }, theme);
          await context.route('**/*', (route) =>
            new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
          );
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (e) => errors.push(e.message));
          const response = await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 90000 });
          assert.equal(response.status(), 200);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('h1').count(), 1);
          assert.match(await page.locator('h1').innerText(), /Надёжное/);
          assert.equal(await page.locator('main').count(), 1);
          assert.equal(await page.locator('#solutions h2').count(), 3);
          assert.equal(await page.locator('html').getAttribute('data-mantine-color-scheme'), theme);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
            false,
            `Overflow at ${width} ${theme}`,
          );
          const expected = `/images/home-v2/hero-${theme}-${width <= 960 ? 960 : 1920}.avif`;
          const resources = await page.evaluate(() =>
            performance
              .getEntriesByType('resource')
              .map((e) => ({ name: e.name, bytes: e.encodedBodySize, decoded: e.decodedBodySize })),
          );
          const heroes = resources.filter((e) => /\/hero-(light|dark)-\d+\.(avif|webp)/.test(e.name));
          assert.equal(heroes.length, 1, 'Download only the selected theme/size, without duplicate fallback');
          assert.ok(heroes[0].name.endsWith(expected));
          assert.ok(heroes[0].bytes > 0 && heroes[0].bytes < 100000);
          const cssBytes = resources.filter((e) => /\.css/.test(e.name)).reduce((sum, e) => sum + e.decoded, 0);
          assert.ok(cssBytes < 150000, `CSS budget: ${cssBytes}`);
          const heroBox = await page.locator('#home').boundingBox();
          assert.ok(Math.abs(heroBox.y) <= 1, 'Hero background continues behind header');
          const headerBox = await page.locator('header').boundingBox();
          const titleBox = await page.locator('h1').boundingBox();
          assert.ok(titleBox.y >= headerBox.height, 'Title clears header');
          if (process.env.VIDSAVE_AXE_SCRIPT) {
            await page.addScriptTag({ content: await readFile(process.env.VIDSAVE_AXE_SCRIPT, 'utf8') });
            const violations = await page.evaluate(async () =>
              (
                await window.axe.run(
                  { include: ['header', '#home', '#solutions'] },
                  { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } },
                )
              ).violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })),
              })),
            );
            assert.deepEqual(violations, [], 'Home accessibility: ' + JSON.stringify(violations));
          }
          if (width === 1280 || width === 390)
            await page.screenshot({ path: path.join(screenshots, `home-${width}-${theme}.png`) });
          console.log(
            'Home metrics',
            width,
            theme,
            JSON.stringify({
              ...(await page.evaluate(() => window.__homeMetrics)),
              heroBytes: heroes[0].bytes,
              cssBytes,
            }),
          );
          if (width === 1280) {
            await page.locator('header summary').click();
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('header details').getAttribute('open'), null);
            await page.locator('header summary').click();
            await page.getByRole('link', { name: 'Для дома', exact: true }).first().click();
            await page.waitForURL(origin + '/for-home');
            assert.equal(await page.locator('header details').getAttribute('open'), null);
            await page.goto(origin + '/', { waitUntil: 'networkidle' });
          } else {
            await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
            await page.getByRole('dialog').waitFor();
            await page.keyboard.press('Escape');
            await page.getByRole('dialog').waitFor({ state: 'hidden' });
          }
          await page.getByRole('button', { name: 'Переключить цветовую тему', exact: true }).click();
          assert.equal(
            await page.locator('html').getAttribute('data-mantine-color-scheme'),
            theme === 'light' ? 'dark' : 'light',
          );
          await page.locator('#home a[href="#request"]').click();
          await page.waitForURL(origin + '/#request');
          await page.locator('#request').waitFor();
          assert.deepEqual(errors, []);
          await context.close();
        }
      console.log('Home screenshots', screenshots);
    } finally {
      await browser.close();
    }
  },
);
