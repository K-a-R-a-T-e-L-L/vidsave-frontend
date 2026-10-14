import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const frontendOrigin = process.env.VIDSAVE_ADMIN_HTTP_TEST_ORIGIN;
const backendOrigin = process.env.VIDSAVE_ADMIN_HTTP_TEST_BACKEND_URL;
const email = process.env.VIDSAVE_ADMIN_HTTP_TEST_EMAIL;
const password = process.env.VIDSAVE_ADMIN_HTTP_TEST_PASSWORD;
const enabled = Boolean(frontendOrigin && backendOrigin && email && password);

async function getBackendLogin() {
  const response = await fetch(`${backendOrigin}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  assert.equal(response.status, 200, 'isolated Stage 3.1 backend login succeeds');
  return response.json();
}

function cookieHeader(session, { includeAccess = true } = {}) {
  const cookies = [];
  if (includeAccess) {
    cookies.push(`vidsave_admin_access_token=${session.accessToken}`);
  }
  cookies.push(`vidsave_admin_refresh_token=${session.refreshToken}`);
  return cookies.join('; ');
}

function cookiePair(response) {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  const get = (name) => {
    const header = setCookies.find((cookie) => cookie.startsWith(`${name}=`));
    return header?.slice(name.length + 1).split(';', 1)[0] ?? null;
  };
  return {
    access: get('vidsave_admin_access_token'),
    refresh: get('vidsave_admin_refresh_token'),
    headers: setCookies,
  };
}

test(
  'anonymous admin routes redirect safely and the unauthenticated BFF is no-store',
  { skip: !frontendOrigin },
  async () => {
    const login = await fetch(`${frontendOrigin}/admin/login`, { redirect: 'manual' });
    assert.equal(login.status, 200);
    assert.match(login.headers.get('x-robots-tag') ?? '', /noindex/i);
    assert.match(login.headers.get('cache-control') ?? '', /no-store/i);

    const admin = await fetch(`${frontendOrigin}/admin`, { redirect: 'manual' });
    assert.ok([302, 307].includes(admin.status));
    assert.equal(new URL(admin.headers.get('location'), frontendOrigin).pathname, '/admin/login');

    const me = await fetch(`${frontendOrigin}/api/admin/me`, { cache: 'no-store' });
    assert.equal(me.status, 401);
    assert.match(me.headers.get('cache-control') ?? '', /no-store/i);
    const body = await me.text();
    assert.doesNotMatch(body, /accessToken|refreshToken|passwordHash/);

    for (const path of ['/api/admin/services', '/api/admin/service-categories']) {
      const catalog = await fetch(`${frontendOrigin}${path}`, { cache: 'no-store' });
      assert.equal(catalog.status, 401, `${path} requires an administrator session`);
      assert.match(catalog.headers.get('cache-control') ?? '', /no-store/i);
    }
  },
);

test('admin POST BFF rejects a foreign Origin before contacting the backend', { skip: !frontendOrigin }, async () => {
  for (const origin of ['https://attacker.invalid', 'https://vidsave.karatell.ru/admin']) {
    const response = await fetch(`${frontendOrigin}/api/admin/admins`, {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'other@example.com', password: 'not-a-real-password' }),
    });
    assert.equal(response.status, 403);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/i);
    assert.deepEqual(await response.json(), { error: 'CSRF_REJECTED' });
  }
});

test('catalog mutation BFF routes reject a foreign Origin', { skip: !frontendOrigin }, async () => {
  for (const path of ['/api/admin/services', '/api/admin/service-categories']) {
    const response = await fetch(`${frontendOrigin}${path}`, {
      method: 'POST',
      headers: { origin: 'https://attacker.invalid', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'forbidden', slug: 'forbidden' }),
    });
    assert.equal(response.status, 403, path);
    assert.deepEqual(await response.json(), { error: 'CSRF_REJECTED' });
  }
});

test(
  'the 25 public page URLs, sitemap, robots, feed, and static images remain available over HTTP',
  { skip: !frontendOrigin },
  async () => {
    const serviceSource = await readFile('src/app/lib/servicesList.ts', 'utf8');
    const serviceSlugs = [...serviceSource.matchAll(/serviceName:\s*["']([^"']+)["']/g)].map((match) => match[1]);
    const serviceIds = [...serviceSource.matchAll(/\bid:\s*(\d+),/g)].map((match) => Number(match[1]));
    assert.equal(serviceSlugs.length, 23);

    const paths = ['/', '/services', ...serviceSlugs.map((slug) => `/services/${slug}`)];
    assert.equal(paths.length, 25);
    for (const pagePath of paths) {
      const response = await fetch(new URL(pagePath, frontendOrigin), { cache: 'no-store' });
      assert.equal(response.status, 200, `${pagePath} remains available`);
      const html = await response.text();
      assert.match(html, /<html lang="ru"/i);
      if (pagePath !== '/') {
        assert.ok(html.includes(`https://vidsave.karatell.ru${pagePath}`), `${pagePath} keeps its canonical URL`);
      }
    }

    const sitemap = await fetch(`${frontendOrigin}/sitemap.xml`, { cache: 'no-store' });
    assert.equal(sitemap.status, 200);
    const sitemapXml = await sitemap.text();
    const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).href);
    assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'sitemap contains no duplicate URLs');
    for (const pagePath of [...paths, '/for-home', '/for-business', '/about', '/contacts']) {
      assert.ok(
        sitemapUrls.includes(new URL(pagePath, 'https://vidsave.karatell.ru').href),
        `${pagePath} remains in the dynamic sitemap`,
      );
    }
    assert.doesNotMatch(sitemapXml, /\/admin(?:\/|<)/i);

    const robots = await fetch(`${frontendOrigin}/robots.txt`, { cache: 'no-store' });
    assert.equal(robots.status, 200);
    assert.match(await robots.text(), /Sitemap:\s*https:\/\/vidsave\.karatell\.ru\/sitemap\.xml/i);

    const feed = await fetch(`${frontendOrigin}/feed/services`, { cache: 'no-store' });
    assert.equal(feed.status, 200);
    assert.match(feed.headers.get('content-type') ?? '', /xml/i);

    for (const id of serviceIds) {
      const image = await fetch(`${frontendOrigin}/images/services/service${id}.png`, { method: 'HEAD' });
      assert.equal(image.status, 200, `service${id}.png remains available`);
    }
  },
);

test(
  'real backend session stays server-only and concurrent Proxy/BFF refresh returns one cookie pair',
  { skip: !enabled },
  async () => {
    const original = await getBackendLogin();
    assert.equal(original.accessExpiresIn, 240);
    assert.equal(original.refreshExpiresIn, 3600);

    const meResponse = await fetch(`${frontendOrigin}/api/admin/me`, {
      headers: { cookie: cookieHeader(original) },
      cache: 'no-store',
    });
    assert.equal(meResponse.status, 200);
    const meBody = await meResponse.text();
    assert.doesNotMatch(meBody, /accessToken|refreshToken|passwordHash/);
    assert.ok(!meBody.includes(original.accessToken));
    assert.ok(!meBody.includes(original.refreshToken));
    assert.ok(meBody.includes(email));

    const originalPage = await fetch(`${frontendOrigin}/admin`, {
      headers: { cookie: cookieHeader(original) },
      cache: 'no-store',
    });
    assert.equal(originalPage.status, 200);
    const pageBody = await originalPage.text();
    assert.doesNotMatch(pageBody, /accessToken|refreshToken|passwordHash/);
    assert.ok(!pageBody.includes(original.accessToken));
    assert.ok(!pageBody.includes(original.refreshToken));

    const refreshOnlyCookie = cookieHeader(original, { includeAccess: false });
    const [proxyResponse, bffResponse] = await Promise.all([
      fetch(`${frontendOrigin}/admin`, {
        headers: { cookie: refreshOnlyCookie },
        redirect: 'manual',
        cache: 'no-store',
      }),
      fetch(`${frontendOrigin}/api/admin/me`, {
        headers: { cookie: refreshOnlyCookie },
        cache: 'no-store',
      }),
    ]);

    assert.equal(proxyResponse.status, 200, 'Proxy refresh keeps the protected page authenticated');
    assert.equal(bffResponse.status, 200, 'BFF waits for the same refresh operation');
    const proxyPair = cookiePair(proxyResponse);
    const bffPair = cookiePair(bffResponse);
    assert.ok(proxyPair.access && proxyPair.refresh, 'Proxy writes both renewed cookies');
    assert.equal(proxyPair.access, bffPair.access);
    assert.equal(proxyPair.refresh, bffPair.refresh);
    assert.ok(proxyPair.headers.every((header) => /HttpOnly/i.test(header)));
    assert.ok(proxyPair.headers.every((header) => /SameSite=Lax/i.test(header)));
    assert.ok(proxyPair.headers.every((header) => /Path=\//i.test(header)));
    assert.ok(proxyPair.headers.every((header) => !/Domain=/i.test(header)));

    const refreshedMe = await fetch(`${frontendOrigin}/api/admin/me`, {
      headers: {
        cookie: `vidsave_admin_access_token=${proxyPair.access}; vidsave_admin_refresh_token=${proxyPair.refresh}`,
      },
      cache: 'no-store',
    });
    assert.equal(refreshedMe.status, 200);

    const adminsResponse = await fetch(`${frontendOrigin}/api/admin/admins`, {
      headers: {
        cookie: `vidsave_admin_access_token=${proxyPair.access}; vidsave_admin_refresh_token=${proxyPair.refresh}`,
      },
      cache: 'no-store',
    });
    assert.equal(adminsResponse.status, 200);
    assert.match(adminsResponse.headers.get('cache-control') ?? '', /no-store/i);
    const adminsBody = await adminsResponse.text();
    assert.doesNotMatch(adminsBody, /accessToken|refreshToken|passwordHash/);

    const createAdmin = await fetch(`${frontendOrigin}/api/admin/admins`, {
      method: 'POST',
      headers: {
        origin: process.env.VIDSAVE_ADMIN_HTTP_MUTATION_ORIGIN || new URL(frontendOrigin).origin,
        'content-type': 'application/json',
        cookie: `vidsave_admin_access_token=${proxyPair.access}; vidsave_admin_refresh_token=${proxyPair.refresh}`,
      },
      body: JSON.stringify({
        email: `stage32-created-${Date.now()}@example.test`,
        password: 'Stage32-Created-Admin-948274!',
      }),
      cache: 'no-store',
    });
    assert.equal(createAdmin.status, 201);
    assert.match(createAdmin.headers.get('cache-control') ?? '', /no-store/i);
    const createdBody = await createAdmin.text();
    assert.doesNotMatch(createdBody, /accessToken|refreshToken|passwordHash|Stage32-Created-Admin/);
  },
);
