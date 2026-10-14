import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.VIDSAVE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.VIDSAVE_PLAYWRIGHT_MODULE).href : '@playwright/test'
);
const origin = process.env.VIDSAVE_BROWSER_ORIGIN;
assert.equal(origin, 'http://localhost:3140', 'Product tests require the disposable Stage 5 frontend');
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
const screenshots = await mkdtemp(path.join(os.tmpdir(), 'vidsave-stage5-browser-'));
const browser = await chromium.launch({
  headless: process.env.VIDSAVE_BROWSER_HEADLESS === '1',
  args: process.env.VIDSAVE_BROWSER_DEBUG_PORT
    ? ['--remote-debugging-port=' + process.env.VIDSAVE_BROWSER_DEBUG_PORT]
    : [],
});
const processSession = await browser.newBrowserCDPSession();
console.log(
  'Task browser PIDs',
  JSON.stringify(
    (await processSession.send('SystemInfo.getProcessInfo')).processInfo.map((p) => ({ type: p.type, pid: p.id })),
  ),
);
await processSession.detach();
const suffix = Date.now().toString();
const errors = [];
let settings, home, post, project, category, media, service, serviceOriginal, context, page;
let viewportChecks = 0;
async function api(route, method = 'GET', data, expected = 200) {
  console.log('Browser API', method, route);
  const response = await context.request.fetch(origin + route, {
    method,
    headers: method === 'GET' ? {} : { origin, 'content-type': 'application/json' },
    data,
    timeout: 10000,
  });
  assert.equal(response.status(), expected, `${method} ${route}: ${(await response.text()).slice(0, 400)}`);
  return response.status() === 204 ? null : await response.json();
}
async function go(route) {
  console.log('Browser route', route);
  const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200, route);
  await page.locator('h1').waitFor();
}
async function field(name, value) {
  console.log('Browser field', name);
  await page
    .getByRole('textbox', { name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    .first()
    .fill(value);
}
async function select(label, option) {
  console.log('Browser select', label, option);
  await page.getByRole('textbox', { name: new RegExp('^' + label) }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
async function save() {
  const email = await page
    .locator('input[type=email]')
    .first()
    .inputValue()
    .catch(() => null);
  const pending = page.waitForResponse(
    (r) => ['POST', 'PATCH'].includes(r.request().method()) && r.url().includes('/api/admin/'),
  );
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  const response = await pending;
  console.log('Browser save status', response.status());
  assert.ok(response.ok(), 'Save HTTP ' + response.status());
  await page.getByText('Изменения сохранены', { exact: true }).last().waitFor();
  const endpoint = new URL(response.url()).pathname;
  if (response.status() === 201) {
    await page.waitForURL((url) => !url.pathname.endsWith('/new'));
    if (endpoint === '/api/admin/admins') {
      const list = await api(endpoint);
      return (Array.isArray(list) ? list : list.items).find((item) => item.email === email);
    }
    return api(endpoint + '/' + new URL(page.url()).pathname.split('/').pop());
  }
  return api(endpoint);
}

async function choose(label) {
  console.log('Browser picker', label);
  await page
    .getByText(label, { exact: true })
    .locator('..')
    .getByRole('button', { name: /Выбрать изображение/ })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Поиск по названию' }).fill('Browser media ' + suffix);
  await dialog.getByRole('button', { name: new RegExp('Browser media ' + suffix) }).click();
}
async function published(pathname, expected = 200) {
  const r = await context.request.get(origin + pathname);
  assert.equal(r.status(), expected, pathname);
  return r.text();
}
function payload(record, names) {
  return Object.fromEntries(names.map((name) => [name, record[name]]));
}
try {
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  context.setDefaultTimeout(20000);
  context.setDefaultNavigationTimeout(20000);
  page = await context.newPage();
  page.on('dialog', (dialog) => {
    console.log('Browser dialog', dialog.type());
    void dialog.accept();
  });
  page.on('pageerror', (e) => errors.push(page.url() + ': ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && /hydration|hydrated|did not match/i.test(m.text())) errors.push(m.text());
  });
  await go('/admin/login');
  await field('Email', 'stage5-admin@example.test');
  await field('Пароль', 'Stage5-test-only-password-12345');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(origin + '/admin');
  assert.ok(
    (await context.cookies())
      .filter((c) => c.name.startsWith('vidsave_admin_'))
      .every((c) => c.httpOnly && c.secure && c.sameSite === 'Lax'),
  );
  settings = await api('/api/admin/cms/settings');
  home = await api('/api/admin/cms/pages/home');
  if (process.env.VIDSAVE_BROWSER_MATRIX_ONLY !== '1') {
    if (settings.privacyPublished) {
      const { policyVersion, telegramConfigured, ...initial } = settings;
      await api('/api/admin/cms/settings', 'PATCH', { ...initial, privacyPublished: false });
    }
    await go('/admin/media');
    await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/upload-32.png'));
    await field('Название изображения', 'Browser media ' + suffix);
    await field('Альтернативное описание', 'Альтернативное описание из браузера');
    const uploadResponse = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/api/admin/cms/media'),
    );
    await page.getByRole('button', { name: 'Загрузить', exact: true }).click();
    media = await (await uploadResponse).json();
    await page.getByText('Browser media ' + suffix, { exact: true }).waitFor();
    assert.equal((await context.request.get(origin + '/media/' + media.id)).status(), 404);
    assert.equal((await context.request.get(origin + '/api/admin/cms/media/' + media.id + '/file')).status(), 200);
    await page
      .getByText('Browser media ' + suffix, { exact: true })
      .locator('..')
      .getByRole('button', { name: 'Редактировать', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Альтернативное описание' })
      .fill('Обновлённый alt из браузера');
    await page.getByRole('button', { name: 'Сохранить описание' }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await go('/admin/blog-categories/new');
    await field('Заголовок', 'Категория браузера ' + suffix);
    await field('Адрес страницы', 'browser-category-' + suffix);
    await select('Статус', 'Опубликовано');
    category = await save();
    await page.waitForURL('**/admin/blog-categories/' + category.id);
    await go('/admin/blog/new');
    await field('Заголовок', 'Статья браузера ' + suffix);
    await field('Адрес страницы', 'browser-post-' + suffix);
    await field('Краткое описание', 'Содержимое, созданное и проверенное через браузер.');
    await field('Заголовок для поиска', 'SEO статьи ' + suffix);
    await field('Описание для поиска', 'Проверяемое описание для поисковых систем.');
    console.log('Editor body');
    await page.locator('.tiptap').fill('Первый абзац статьи из браузера.');
    console.log('Editor table');
    await page.getByRole('button', { name: 'Добавить таблицу', exact: true }).click();
    await page.locator('.tiptap th').first().fill('Заголовок таблицы');
    await choose('Вставить изображение в текст');
    await choose('Обложка');
    console.log('Select article category');
    await page.getByRole('textbox', { name: 'Категории статьи' }).click();
    await page.getByRole('option', { name: 'Категория браузера ' + suffix }).click();
    await page.getByRole('textbox', { name: 'Категории статьи' }).press('Escape');
    console.log('Save article');
    post = await save();
    await page.waitForURL('**/admin/blog/' + post.id);
    assert.equal((await context.request.get(origin + '/blog/' + post.slug)).status(), 404);
    await page.getByRole('button', { name: 'Предпросмотр', exact: true }).click();
    assert.ok(await page.getByRole('dialog').locator('table').isVisible());
    await page.getByRole('dialog').getByRole('button', { name: 'Закрыть', exact: true }).click();
    await select('Статус', 'Опубликовано');
    post = await save();
    assert.ok(post.publishedAt);
    assert.equal(await page.getByRole('textbox', { name: /^Адрес страницы/ }).isDisabled(), true);
    const html = await published('/blog/' + post.slug);
    assert.ok(html.includes('SEO статьи ' + suffix));
    assert.ok(html.includes('Обновлённый alt из браузера'));
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('BlogPosting'));
    assert.ok((await published('/sitemap.xml')).includes('/blog/' + post.slug));
    await go('/blog');
    await field('Поиск материалов', 'Статья браузера ' + suffix);
    await page.getByRole('button', { name: 'Найти', exact: true }).click();
    await page.waitForURL('**/blog?search=*');
    await page
      .getByRole('link', { name: 'Статья браузера ' + suffix, exact: true })
      .first()
      .click();
    await page.waitForURL('**/blog/' + post.slug);
    await go('/admin/projects/new');
    await field('Заголовок', 'Проект браузера ' + suffix);
    await field('Адрес страницы', 'browser-project-' + suffix);
    await field('Краткое описание', 'Подтверждённый тестовый проект изолированного стенда.');
    await field('Тип объекта', 'Тестовый объект');
    await field('Задача', 'Проверка создания проекта');
    await field('Выполненное решение', 'Проверка решения');
    await field('Результат', 'Проверка результата');
    await choose('Обложка');
    await choose('Галерея проекта');
    await page.getByRole('dialog').getByRole('button', { name: 'Закрыть', exact: true }).click();
    await select('Статус', 'Опубликовано');
    project = await save();
    await page.waitForURL('**/admin/projects/' + project.id);
    assert.ok((await published('/projects/' + project.slug)).includes('Проверка результата'));
    await go('/admin/pages/home');
    await field('Заголовок страницы', 'Проверенный заголовок главной ' + suffix);
    await field('Вступление', 'Проверенное вступление главной');
    await field('Заголовок для поиска', 'SEO главной ' + suffix);
    await page.getByRole('button', { name: 'Добавить вопрос', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Вопрос', exact: true })
      .last()
      .fill('Тестовый вопрос ' + suffix);
    await page.getByRole('textbox', { name: 'Ответ', exact: true }).last().fill('Тестовый ответ');
    await save();
    const homepage = await published('/');
    assert.ok(homepage.includes('Проверенный заголовок главной ' + suffix));
    assert.ok(homepage.includes('Тестовый вопрос ' + suffix));
    assert.ok(homepage.includes('SEO главной ' + suffix));
    await go('/admin/settings');
    await field('Основной телефон', '8-900-123-45-67');
    await field('Основная почта', 'browser-contact@example.test');
    await field('Согласованный текст согласия', 'Тестовое согласие изолированного стенда ' + suffix);
    await page.locator('.tiptap').fill('Тестовая политика изолированного стенда. Не юридический документ.');
    await page.getByRole('checkbox', { name: 'Опубликовать согласованную политику и включить форму заявок' }).click();
    await page.getByRole('button', { name: 'Документ согласован' }).click();
    await save();
    const contacts = await published('/contacts');
    assert.ok(contacts.includes('browser-contact@example.test'));
    assert.ok(contacts.includes('tel:+79001234567'));
    await go('/contacts');
    await field('Ваше имя', 'Клиент браузера ' + suffix);
    await field('Телефон для связи', '8 (901) 000-' + String(1000 + Math.floor(Math.random() * 9000)));
    await field('О вашей задаче', 'Проверяемая заявка браузера');
    assert.equal(await page.getByRole('button', { name: 'Отправить заявку' }).isDisabled(), true);
    await page.getByRole('checkbox', { name: new RegExp('Тестовое согласие') }).check();
    await page.getByRole('button', { name: 'Отправить заявку' }).click();
    await page.getByRole('status').filter({ hasText: 'Заявка сохранена' }).waitFor();
    await go('/admin/leads');
    await field('Поиск', 'Клиент браузера ' + suffix);
    await page
      .getByRole('row')
      .filter({ hasText: 'Клиент браузера ' + suffix })
      .getByRole('link', { name: 'Открыть', exact: true })
      .click();
    await page.getByRole('textbox', { name: 'Внутренняя заметка' }).fill('Обработано через браузер');
    await select('Статус', 'В работе');
    await save();
    const catalog = await api('/api/admin/services?limit=100');
    service = catalog.items[0];
    serviceOriginal = await api('/api/admin/services/' + service.id);
    await go('/admin/services/' + service.id);
    await page
      .getByRole('textbox', { name: /^Описание/ })
      .first()
      .fill('Проверенное описание существующей услуги ' + suffix);
    await save();
    assert.ok(
      (await published('/services/' + service.slug)).includes('Проверенное описание существующей услуги ' + suffix),
    );
    await go('/admin/admins/new');
    await field('Email', 'browser-' + suffix + '@example.test');
    await field('Пароль', 'Browser-test-only-password-12345');
    const createdAdmin = await save();
    await go('/admin/admins');
    await field('Поиск', 'browser-' + suffix);
    await page
      .getByText('browser-' + suffix + '@example.test', { exact: true })
      .first()
      .waitFor();
    assert.ok(createdAdmin.id);
    for (const route of ['/api/admin/cms/posts', '/api/leads']) {
      const foreign = await context.request.post(origin + route, {
        headers: { origin: 'https://attacker.invalid', 'content-type': 'application/json' },
        data: {},
      });
      assert.equal(foreign.status(), 403);
    }
  } else {
    post = (
      await api('/api/admin/cms/posts?status=published&search=' + encodeURIComponent('Статья браузера') + '&limit=1')
    ).items[0];
    project = (
      await api('/api/admin/cms/projects?status=published&search=' + encodeURIComponent('Проект браузера') + '&limit=1')
    ).items[0];
    assert.ok(post?.slug.startsWith('browser-post-') && project?.slug.startsWith('browser-project-'));
    category = post.categories[0];
    const { policyVersion, telegramConfigured, ...input } = settings;
    await api('/api/admin/cms/settings', 'PATCH', {
      ...input,
      privacyPublished: true,
      privacyBody: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Только тестовая политика изолированного стенда.' }] },
        ],
      },
      consentText: 'Согласие изолированного тестового стенда',
    });
    const admins = await api('/api/admin/admins');
    const account = admins.find((item) => item.email.startsWith('browser-'));
    await go('/admin/admins');
    await field('Поиск', account.email);
    await page.getByText(account.email, { exact: true }).first().waitFor();
  }
  const publicRoutes = [
    '/',
    '/services',
    '/for-home',
    '/for-business',
    '/projects',
    '/blog',
    '/about',
    '/contacts',
    '/blog/' + post.slug,
    '/projects/' + project.slug,
    '/blog/category/' + category.slug,
    '/privacy',
  ];
  const adminRoutes = [
    '/admin',
    '/admin/services',
    '/admin/service-categories',
    '/admin/pages',
    '/admin/blog',
    '/admin/blog-categories',
    '/admin/projects',
    '/admin/media',
    '/admin/leads',
    '/admin/seo',
    '/admin/settings',
    '/admin/admins',
    '/admin/blog/' + post.id,
  ];
  for (const width of process.env.VIDSAVE_BROWSER_INTERACTIONS_ONLY === '1'
    ? []
    : [320, 375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await go('/');
      if ((await page.locator('html').getAttribute('data-mantine-color-scheme')) !== theme)
        await page.getByRole('button', { name: 'Переключить цветовую тему', exact: true }).click();
      for (const route of [...publicRoutes, ...adminRoutes]) {
        await go(route);
        assert.equal(await page.locator('h1').count(), 1, route);
        assert.equal(await page.locator('html').getAttribute('data-mantine-color-scheme'), theme);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
          `${width} ${theme} ${route} document overflow`,
        );
        assert.equal(
          await page.locator('main').evaluate((e) => e.scrollWidth > e.clientWidth + 1),
          false,
          `${width} ${theme} ${route} main overflow`,
        );
        if (
          (width === 375 || width === 1440) &&
          ['/', '/admin', '/admin/settings', '/admin/blog/' + post.id].includes(route)
        )
          await page.screenshot({
            path: path.join(screenshots, route.replaceAll('/', '-') + '-' + width + '-' + theme + '.png'),
            fullPage: true,
          });
        viewportChecks++;
      }
      console.log(`Viewport ${width} ${theme}: ${publicRoutes.length} public and ${adminRoutes.length} admin pages`);
    }
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await go('/admin');
  await page.getByRole('button', { name: 'Открыть меню администратора' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Медиа', exact: true }).click();
  await page.waitForURL('**/admin/media');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('dialog').isVisible(), false);
  await go('/admin/blog/' + post.id);
  await select('Статус', 'Черновик');
  post = await save();
  assert.equal((await context.request.get(origin + '/blog/' + post.slug)).status(), 404);
  assert.ok(!(await published('/sitemap.xml')).includes('/blog/' + post.slug));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      viewportChecks,
      screenshots,
      hydrationErrors: errors,
      flows:
        process.env.VIDSAVE_BROWSER_MATRIX_ONLY === '1'
          ? ['login', 'admin list', 'mobile Drawer', 'unpublish']
          : [
              'login',
              'media upload/edit/privacy',
              'blog category',
              'article/editor/table/image/preview/publish/unpublish',
              'project/gallery',
              'static content/FAQ/SEO',
              'contacts/privacy/lead',
              'legacy service update',
              'admin creation',
              'CSRF',
              'mobile Drawer',
            ],
    }),
  );
} catch (error) {
  if (page)
    await page
      .screenshot({ path: path.join(screenshots, 'failure.png'), fullPage: true, timeout: 5000 })
      .catch(() => {});
  console.error('Failure screenshot', path.join(screenshots, 'failure.png'));
  throw error;
} finally {
  if (context) {
    try {
      if (settings) {
        const { policyVersion, telegramConfigured, ...input } = settings;
        await api('/api/admin/cms/settings', 'PATCH', input);
      }
      if (home)
        await api(
          '/api/admin/cms/pages/home',
          'PATCH',
          payload(home, ['document', 'seoTitle', 'seoDescription', 'canonical', 'noindex', 'ogImageId']),
        );
      if (serviceOriginal)
        await api(
          '/api/admin/services/' + service.id,
          'PATCH',
          payload({ ...serviceOriginal, categoryId: serviceOriginal.category.id }, [
            'name',
            'slug',
            'description',
            'details',
            'categoryId',
            'priceMode',
            'priceRub',
            'unitLabel',
            'sortOrder',
            'status',
            'seoTitle',
            'seoDescription',
            'mediaId',
          ]),
        );
    } catch (e) {
      console.error('Isolated fixture restoration failed', e.message);
      process.exitCode = 1;
    }
    await context.close();
  }
  await browser.close();
  console.log('Owned browser closed; screenshot directory', screenshots);
}

await import('./service-browser.mjs');
