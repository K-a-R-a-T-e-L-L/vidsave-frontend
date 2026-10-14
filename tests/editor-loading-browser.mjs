import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const origin = process.env.VIDSAVE_EDITOR_TEST_ORIGIN;
assert.equal(origin, 'http://localhost:3143', 'Use the disposable Node 22 development frontend');
const { chromium } = await import(
  process.env.VIDSAVE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.VIDSAVE_PLAYWRIGHT_MODULE).href : '@playwright/test'
);
const deadline = Date.now() + 90000;
let ready = false;
while (Date.now() < deadline) {
  try {
    if ((await fetch(origin + '/admin/login', { signal: AbortSignal.timeout(10000) })).ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
assert.ok(ready);
const browser = await chromium.launch({ headless: process.env.VIDSAVE_BROWSER_HEADLESS === '1' });
let context, input, record, backendSession;
try {
  const cdp = await browser.newBrowserCDPSession();
  console.log(
    'Editor browser PIDs',
    JSON.stringify((await cdp.send('SystemInfo.getProcessInfo')).processInfo.map((p) => ({ type: p.type, pid: p.id }))),
  );
  await cdp.detach();
  context = await browser.newContext();
  context.setDefaultTimeout(30000);
  context.setDefaultNavigationTimeout(60000);
  const page = await context.newPage();
  page.on('dialog', (d) => {
    void d.accept();
  });
  await page.goto(origin + '/admin/login');
  await page.getByLabel('Email', { exact: true }).fill('stage5-admin@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Stage5-test-only-password-12345');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL('**/admin');
  input = {
    title: 'Editor loading fixture',
    slug: 'editor-loading-' + Date.now(),
    status: 'draft',
    excerpt: 'Disposable test only',
    body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fixture text' }] }] },
    categoryIds: [],
  };
  backendSession = await (
    await fetch('http://127.0.0.1:3141/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'stage5-admin@example.test', password: 'Stage5-test-only-password-12345' }),
    })
  ).json();
  const created = await fetch('http://127.0.0.1:3141/api/admin/cms/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + backendSession.accessToken },
    body: JSON.stringify(input),
  });
  assert.equal(created.status, 201);
  record = await created.json();
  let requests = 0;
  const endpoint = origin + '/api/admin/cms/posts/' + record.id;
  await context.route(endpoint, async (route) => {
    const sequence = ++requests;
    const response = await route.fetch();
    if (sequence === 1) await new Promise((r) => setTimeout(r, 1800));
    await route.fulfill({ response });
  });
  await page.goto(origin + '/admin/blog/' + record.id);
  const title = page.getByRole('textbox', { name: /^Заголовок/ }).first();
  await title.fill('Несохранённый текст должен сохраниться');
  await page.waitForTimeout(2200);
  assert.ok(requests >= 2, 'Strict Mode must exercise two initial requests');
  assert.equal(await title.inputValue(), 'Несохранённый текст должен сохраниться');
  await context.unroute(endpoint);
  await context.route(endpoint, (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"SERVICE_UNAVAILABLE"}' }),
  );
  await page.goto(origin + '/admin/blog/' + record.id);
  await page.getByRole('button', { name: 'Повторить загрузку' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Сохранить', exact: true }).count(), 0);
  await context.unroute(endpoint);
  await page.getByRole('button', { name: 'Повторить загрузку' }).click();
  await title.waitFor();
  assert.equal(await title.inputValue(), record.title);
  console.log('Strict Mode stale-response protection and load-error retry passed');
} finally {
  if (context) {
    if (record)
      await fetch('http://127.0.0.1:3141/api/admin/cms/posts/' + record.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + backendSession.accessToken },
        body: JSON.stringify({ ...input, status: 'archived' }),
      });
    if (backendSession)
      await fetch('http://127.0.0.1:3141/api/admin/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: backendSession.refreshToken }),
      });
    await context.close();
  }
  await browser.close();
  console.log('Editor browser closed');
}
