import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.VIDSAVE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.VIDSAVE_PLAYWRIGHT_MODULE).href : '@playwright/test'
);
const origin = process.env.VIDSAVE_BROWSER_ORIGIN;
assert.equal(origin, 'http://localhost:3140', 'Only the disposable Stage 5 fixture is allowed');
const browser = await chromium.launch({ headless: process.env.VIDSAVE_BROWSER_HEADLESS === '1' });
const cdp = await browser.newBrowserCDPSession();
console.log('Theme media browser PIDs', JSON.stringify((await cdp.send('SystemInfo.getProcessInfo')).processInfo));
await cdp.detach();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.route('**/*', (r) => (new URL(r.request().url()).origin === origin ? r.continue() : r.abort()));
const page = await context.newPage();
context.setDefaultTimeout(20000);
const errors = [],
  uploaded = [];
let original;
page.on('pageerror', (error) => errors.push(page.url() + ': ' + error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && /hydration|hydrated|did not match/i.test(message.text()))
    errors.push(message.text());
});
async function api(route, method = 'GET', data, status = 200) {
  const response = await context.request.fetch(origin + '/api/admin/cms/' + route, {
    method,
    data,
    headers: { origin, 'content-type': 'application/json' },
    timeout: 10000,
  });
  assert.equal(response.status(), status, route);
  return response.status() === 204 ? null : response.json();
}
async function go(route) {
  const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200, route);
}
try {
  await go('/admin/login');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('stage5-admin@example.test');
  await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill('Stage5-test-only-password-12345');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(origin + '/admin');
  original = await api('settings');
  const article = (await api('posts?search=' + encodeURIComponent('Статья браузера') + '&limit=1')).items[0];
  assert.ok(article, 'The product workflow must create the table regression article');
  const screenshots = await mkdtemp(path.join(os.tmpdir(), 'vidsave-stage5-editor-'));
  let editorChecks = 0;
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await go('/admin/blog/' + article.id);
      if ((await page.locator('html').getAttribute('data-mantine-color-scheme')) !== theme)
        await page.getByRole('button', { name: 'Переключить цветовую тему', exact: true }).click();
      await page.reload({ waitUntil: 'networkidle' });
      const cell = page.locator('.tiptap th').first();
      await cell.waitFor();
      assert.equal(await page.locator('.tiptap th, .tiptap td').count(), 9);
      assert.equal(await cell.evaluate((e) => getComputedStyle(e).borderTopStyle), 'solid');
      assert.equal(await page.locator('main').evaluate((e) => e.scrollWidth > e.clientWidth + 1), false);
      if (theme === 'dark' && [375, 1440].includes(width))
        await page.screenshot({ path: path.join(screenshots, 'editor-' + width + '.png'), fullPage: true });
      editorChecks++;
    }
  }
  console.log('Editor table geometry and theme reload passed', editorChecks, 'checks; screenshots', screenshots);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const suffix = Date.now();
  for (const [theme, file] of [
    ['light', '../tests/fixtures/upload-32.png'],
    ['dark', '../tests/fixtures/upload-16.png'],
  ]) {
    await go('/admin/media');
    await page.locator('input[type=file]').setInputFiles(path.resolve('public', file));
    await page.getByRole('textbox', { name: 'Название изображения', exact: true }).fill('Hero ' + theme + ' ' + suffix);
    await page.getByRole('textbox', { name: 'Альтернативное описание', exact: true }).fill('Проверенный Hero ' + theme);
    const pending = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/api/admin/cms/media'),
    );
    await page.getByRole('button', { name: 'Загрузить', exact: true }).click();
    assert.equal((await pending).status(), 201);
    await page.getByText('Hero ' + theme + ' ' + suffix, { exact: true }).waitFor();
    uploaded.push((await api('media?search=' + encodeURIComponent('Hero ' + theme + ' ' + suffix))).items[0]);
  }
  await go('/admin/settings');
  for (const [index, label] of ['Hero — светлая тема', 'Hero — тёмная тема'].entries()) {
    await page
      .getByText(label, { exact: true })
      .locator('..')
      .getByRole('button', { name: /Выбрать изображение/ })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Поиск по названию' }).fill(uploaded[index].title);
    await dialog.getByRole('button', { name: new RegExp(uploaded[index].title) }).click();
  }
  const saving = page.waitForResponse(
    (r) => r.request().method() === 'PATCH' && r.url().endsWith('/api/admin/cms/settings'),
  );
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  assert.equal((await saving).status(), 200);
  await page.getByText('Изменения сохранены', { exact: true }).waitFor();
  const settings = await api('settings');
  assert.equal(settings.heroLight, '/media/' + uploaded[0].id);
  assert.equal(settings.heroDark, '/media/' + uploaded[1].id);
  let stableImages;
  for (const [index, theme] of ['light', 'dark'].entries()) {
    await go('/');
    if ((await page.locator('html').getAttribute('data-mantine-color-scheme')) !== theme)
      await page.getByRole('button', { name: 'Переключить цветовую тему', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-mantine-color-scheme'), theme);
    const hero = page.getByRole('img', { name: 'Проверенный Hero ' + theme, exact: true });
    assert.ok(await hero.isVisible());
    assert.ok(
      (await hero.evaluate((e) => getComputedStyle(e).backgroundImage)).includes('/media/' + uploaded[index].id),
    );
    const images = await page.locator('main img').evaluateAll((elements) => elements.map((e) => e.currentSrc));
    if (stableImages)
      assert.deepEqual(images, stableImages, 'Other public images keep their sources when the theme changes');
    stableImages = images;
    await go('/admin/settings');
    assert.ok(await page.locator('.admin-theme-' + (theme === 'dark' ? 'dark' : 'light')).isVisible());
    assert.equal(await page.locator('.admin-theme-' + (theme === 'dark' ? 'light' : 'dark')).isVisible(), false);
  }
  assert.deepEqual(errors, []);
  console.log('Both Hero images changed through CMS; theme reload, independent media and hydration passed');
} finally {
  try {
    if (original) {
      const { policyVersion, telegramConfigured, ...input } = original;
      await api('settings', 'PATCH', input);
    }
    for (const media of uploaded) await api('media/' + media.id, 'DELETE');
  } finally {
    await context.close();
    await browser.close();
    console.log('Theme media browser closed');
  }
}
