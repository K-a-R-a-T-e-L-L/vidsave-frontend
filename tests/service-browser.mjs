import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = await import(
  process.env.VIDSAVE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.VIDSAVE_PLAYWRIGHT_MODULE).href : '@playwright/test'
);
const origin = process.env.VIDSAVE_BROWSER_ORIGIN;
assert.equal(origin, 'http://localhost:3140');
const readyDeadline = Date.now() + 45000;
let fixtureReady = false;
while (Date.now() < readyDeadline) {
  try {
    const response = await fetch(origin + '/api/leads', { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      fixtureReady = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 500));
}
assert.ok(fixtureReady, 'Disposable fixture API must be ready before browser login');
const browser = await chromium.launch({ headless: process.env.VIDSAVE_BROWSER_HEADLESS === '1' });
const cdp = await browser.newBrowserCDPSession();
console.log(
  'Service browser PIDs',
  JSON.stringify((await cdp.send('SystemInfo.getProcessInfo')).processInfo.map((p) => ({ type: p.type, pid: p.id }))),
);
await cdp.detach();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.setDefaultTimeout(20000);
context.setDefaultNavigationTimeout(20000);
await context.route('**/*', (r) => (new URL(r.request().url()).origin === origin ? r.continue() : r.abort()));
const page = await context.newPage();
const suffix = Date.now();
let service;
page.on('dialog', (d) => {
  void d.accept();
});
async function go(route) {
  await page.goto(origin + route, { waitUntil: 'networkidle' });
}
async function input(name, value) {
  await page.getByLabel(name, { exact: false }).first().fill(value);
}
async function choose(label, value) {
  await page.getByRole('textbox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function api(route, method = 'GET', data, status = 200) {
  const r = await context.request.fetch(origin + route, {
    method,
    data,
    headers: { origin, 'content-type': 'application/json' },
    timeout: 10000,
  });
  assert.equal(r.status(), status, route);
  return r.json();
}
async function save() {
  const pending = page.waitForResponse(
    (r) => ['POST', 'PATCH'].includes(r.request().method()) && r.url().includes('/api/admin/'),
  );
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  const r = await pending;
  assert.ok(r.ok());
  await page.getByText('Изменения сохранены', { exact: true }).last().waitFor();
  if (r.status() === 201) await page.waitForURL((url) => !url.pathname.endsWith('/new'));
  return api(
    new URL(r.url()).pathname + (r.status() === 201 ? '/' + new URL(page.url()).pathname.split('/').pop() : ''),
  );
}
try {
  await go('/admin/login');
  await input('Email', 'stage5-admin@example.test');
  await input('Пароль', 'Stage5-test-only-password-12345');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(origin + '/admin');
  await go('/admin/service-categories/new');
  await input('Название', 'Категория услуг браузера ' + suffix);
  await input('Адрес категории', 'service-category-' + suffix);
  await input('Описание', 'Описание тестовой категории');
  const category = await save();
  await go('/admin/media');
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/upload-32.png'));
  await input('Название изображения', 'Service image ' + suffix);
  await input('Альтернативное описание', 'Изображение услуги из браузера');
  await page.getByRole('button', { name: 'Загрузить', exact: true }).click();
  await page.getByText('Service image ' + suffix, { exact: true }).waitFor();
  await go('/admin/services/new');
  await input('Название', 'Услуга браузера ' + suffix);
  await input('Адрес страницы', 'service-browser-' + suffix);
  await input('Описание', 'Описание тестовой услуги');
  await input('Цена, ₽', '1234.50');
  await choose('Категория', category.name);
  await page
    .getByText('Изображение услуги', { exact: true })
    .locator('..')
    .getByRole('button', { name: /Выбрать изображение/ })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: 'Поиск по названию' })
    .fill('Service image ' + suffix);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: new RegExp('Service image ' + suffix) })
    .click();
  await choose('Статус', 'Опубликовано');
  service = await save();
  assert.equal(service.legacyId, null);
  await input('Цена, ₽', '3456.70');
  await save();
  await go('/services/' + service.slug);
  assert.ok((await page.locator('main').innerText()).includes('456,70'));
  const image = page.locator('main img').first();
  assert.ok((await image.getAttribute('src')).startsWith('/media/'));
  assert.equal(await image.getAttribute('alt'), 'Изображение услуги из браузера');
  await image.evaluate((e) => e.decode());
  await go('/admin');
  await page.getByRole('button', { name: 'Выход', exact: true }).click();
  await page.waitForURL('**/admin/login');
  assert.ok(!(await context.cookies()).some((c) => c.name.startsWith('vidsave_admin_')));
  assert.equal((await context.request.get(origin + '/api/admin/me')).status(), 401);
  await input('Email', 'stage5-admin@example.test');
  await input('Пароль', 'Stage5-test-only-password-12345');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(origin + '/admin');
  await api('/api/admin/services/' + service.id, 'PATCH', { status: 'archived' });
  assert.equal((await context.request.get(origin + '/services/' + service.slug)).status(), 404);
  await go('/admin/media');
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/upload-32.png'));
  await input('Название изображения', 'Unused image ' + suffix);
  await page.getByRole('button', { name: 'Загрузить', exact: true }).click();
  await page.getByText('Unused image ' + suffix, { exact: true }).waitFor();
  await page
    .getByText('Unused image ' + suffix, { exact: true })
    .locator('..')
    .getByRole('button', { name: 'Удалить', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Удалить', exact: true }).click();
  await page.getByText('Unused image ' + suffix, { exact: true }).waitFor({ state: 'hidden' });
  console.log(
    'Browser service creation, category, media, changed price, logout/relogin, archive and unused file deletion passed',
  );
} finally {
  if (service) {
    const r = await context.request.patch(origin + '/api/admin/services/' + service.id, {
      headers: { origin, 'content-type': 'application/json' },
      data: { status: 'archived' },
    });
    if (![200, 401].includes(r.status())) console.error('Fixture service archive status', r.status());
  }
  await context.close();
  await browser.close();
  console.log('Service browser closed');
}

await import('./theme-media-browser.mjs');
