import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

// Use an installed Playwright module; no runtime dependency is added to the site.
const { chromium } = await import(
  process.env.VIDSAVE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.VIDSAVE_PLAYWRIGHT_MODULE).href : 'playwright'
);
const origin = process.env.VIDSAVE_BROWSER_ORIGIN;
assert.ok(origin, 'Set VIDSAVE_BROWSER_ORIGIN to the isolated Next production runtime');
const fixture = JSON.parse((await readFile('tests/fixtures/catalog.json', 'utf8')).replace(/^\uFEFF/, ''));
const routes = ['/', '/services', '/for-home', '/for-business', '/projects', '/blog', '/about', '/contacts'];
const screenshots = await mkdtemp(path.join(os.tmpdir(), 'vidsave-stage41-browser-'));
const browser = await chromium.launch({ headless: process.env.VIDSAVE_BROWSER_HEADLESS === '1' });
const browserSession = await browser.newBrowserCDPSession();
const processInfo = await browserSession.send('SystemInfo.getProcessInfo');
console.log(
  `Playwright process IDs: ${processInfo.processInfo.map((item) => `${item.type}:${item.id}`).join(', ')}; screenshots: ${screenshots}`,
);
await browserSession.detach();
let checks = 0;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  // Keep external analytics and map services out of this local smoke test.
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration|hydrated|did not match/i.test(message.text()))
      errors.push(message.text());
  });
  const images = new Map();
  await page.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-mantine-color-scheme'), 'light');
  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await page.goto(origin + '/', { waitUntil: 'networkidle' });
      if ((await page.locator('html').getAttribute('data-mantine-color-scheme')) !== theme)
        await page.getByRole('button', { name: 'Переключить цветовую тему', exact: true }).click();
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('html').getAttribute('data-mantine-color-scheme'), theme);
      for (const route of routes) {
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route);
        assert.equal(await page.locator('h1').count(), 1, route);
        assert.equal(await page.locator('html').getAttribute('data-mantine-color-scheme'), theme);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, `${width} ${theme} ${route}`);
        const mainOverflow = await page
          .locator('main')
          .evaluate((element) => element.scrollWidth > element.clientWidth + 1);
        assert.equal(mainOverflow, false, `${width} ${theme} ${route}: main overflow`);
        if (route !== '/') {
          assert.ok(await page.getByRole('navigation', { name: 'Хлебные крошки' }).isVisible());
          const nav = page.getByRole('navigation', { name: 'Основная навигация', exact: true, includeHidden: true });
          assert.equal(await nav.locator('a[aria-current="page"]').getAttribute('href'), route);
        }
        if (route === '/') {
          const hero = await page
            .locator('[class*="heroPhoto"]')
            .evaluate((element) => getComputedStyle(element).backgroundImage);
          assert.ok(hero.includes(`hero-${theme}.webp`));
        }
        const sources = await page
          .locator('main img')
          .evaluateAll((nodes) => nodes.map((image) => image.getAttribute('src')));
        const key = `${width}:${route}`;
        if (theme === 'light') images.set(key, sources);
        else assert.deepEqual(sources, images.get(key), 'Only homepage hero background may change');
        if (width === 375 || width === 1440)
          await page.screenshot({
            path: path.join(screenshots, `${route.replaceAll('/', '-') || 'home'}-${width}-${theme}.png`),
            fullPage: true,
          });
        checks++;
      }
      console.log(`Checked ${width}px / ${theme}: all eight public routes`);
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  for (const route of routes.slice(1)) {
    await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
    const nav = page.getByRole('navigation', { name: 'Мобильная навигация', exact: true });
    await nav.waitFor({ state: 'visible' });
    assert.deepEqual(
      await nav.locator('a[href^="/"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))),
      [...routes.slice(1), '/contacts'],
    );
    await nav.locator(`a[href="${route}"]`).first().click();
    await page.waitForURL(origin + route);
    await page.waitForLoadState('networkidle');
    assert.equal(await nav.isVisible(), false);
  }
  await page.goto(origin + '/services', { waitUntil: 'networkidle' });
  await page
    .getByRole('navigation', { name: 'Категории услуг' })
    .getByRole('link', { name: fixture.categories[0].name, exact: true })
    .click();
  await page.waitForURL('**/services?category=*');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(
    await page.locator('main article').count(),
    fixture.services.filter((item) => item.category.id === fixture.categories[0].id).length,
  );
  for (const service of fixture.services) {
    const response = await page.goto(`${origin}/services/${service.slug}`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').textContent(), service.name);
    assert.equal(
      await page.locator('main').evaluate((element) => element.scrollWidth > element.clientWidth + 1),
      false,
    );
    const image = page.locator('main img').first();
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element) => element.decode());
  }
  const unknown = await page.goto(origin + '/services/does-not-exist', { waitUntil: 'networkidle' });
  assert.equal(unknown.status(), 404);
  await page.goto(origin + '/admin/login', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('input[type="password"]').count(), 1);
  await page.goto(origin + '/admin', { waitUntil: 'networkidle' });
  assert.equal(new URL(page.url()).pathname, '/admin/login');
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      publicViewportChecks: checks,
      servicePages: 23,
      menuRoutes: 7,
      hydrationErrors: errors,
      screenshotPath: screenshots,
    }),
  );
  await context.close();
} finally {
  await browser.close();
}
