import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();

async function loadTypeScript(relativePath) {
  const source = await readFile(path.join(root, relativePath), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal(diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const [servicesModule, site] = await Promise.all([
  loadTypeScript('src/app/lib/servicesList.ts'),
  loadTypeScript('src/app/lib/site.ts'),
]);

test('service records have unique IDs/slugs, descriptions, and matching local images', async () => {
  const services = servicesModule.servicesList;
  assert.equal(services.length, 23);
  assert.equal(new Set(services.map((service) => service.id)).size, services.length);
  assert.equal(new Set(services.map((service) => service.serviceName)).size, services.length);

  for (const service of services) {
    assert.match(service.serviceName, /^[a-z0-9()-]+$/);
    assert.ok(service.name.trim());
    assert.ok(service.description.trim());
    assert.ok(Number.isFinite(service.price) && service.price >= 0);
    await readFile(path.join(root, `public/images/services/service${service.id}.png`));
  }
});

test('service metadata is unique, canonical, and uses the configured public origin', () => {
  const services = servicesModule.servicesList;
  const metadata = services.map((service) => site.getServiceMetadata(service));
  const titles = metadata.map((item) => item.title);
  const canonicals = metadata.map((item) => item.alternates.canonical);

  assert.equal(new Set(titles).size, services.length);
  assert.equal(new Set(canonicals).size, services.length);
  metadata.forEach((item, index) => {
    assert.ok(item.title.includes(services[index].name));
    assert.ok(item.description.length <= 155);
    assert.equal(new URL(item.alternates.canonical).origin, site.siteConfig.url);
    assert.equal(item.openGraph.url, item.alternates.canonical);
    assert.equal(item.twitter.card, 'summary_large_image');
  });
});

test('sitemap has the home page, catalog, and every unique service URL', () => {
  const routes = site.buildSitemapEntries(servicesModule.servicesList);
  const urls = routes.map((entry) => entry.url);

  assert.equal(routes.length, 32);
  assert.ok(urls.includes(`${site.siteConfig.url}/videonablyudenie`));
  assert.ok(urls.includes(site.siteConfig.url + '/kondicionery'));
  assert.ok(urls.includes(site.siteConfig.url + '/elektromontazh'));
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.includes(site.siteConfig.url));
  assert.ok(urls.includes(`${site.siteConfig.url}/services`));
  assert.ok(urls.every((url) => url.startsWith(`${site.siteConfig.url}/`) || url === site.siteConfig.url));
  assert.ok(
    servicesModule.servicesList.every((service) =>
      urls.includes(`${site.siteConfig.url}/services/${service.serviceName}`),
    ),
  );
  assert.ok(!urls.some((url) => url.includes('vidsave.ru')));
});

test('robots allows the site and points its sitemap at the configured host', async () => {
  const robots = await readFile(path.join(root, 'public/robots.txt'), 'utf8');
  assert.match(robots, /Allow:\s*\//);
  assert.ok(robots.includes(`Sitemap: ${site.siteConfig.url}/sitemap.xml`));
  assert.ok(!robots.includes('https://vidsave.ru'));
});

test('unknown services use Next notFound and unknown URLs use the not-found route', async () => {
  const serviceRoute = await readFile(path.join(root, 'src/app/(frontend)/services/[serviceName]/page.tsx'), 'utf8');
  const notFoundPage = await readFile(path.join(root, 'src/app/(frontend)/not-found.tsx'), 'utf8');
  assert.match(serviceRoute, /if\s*\(!service\)\s*notFound\(\)/);
  assert.match(notFoundPage, /export\s+const\s+metadata/);
});

test('source files contain no references to the unmanaged old domain', async () => {
  const files = [
    'src/app/lib/site.ts',
    'src/app/(frontend)/sitemap.ts',
    'src/app/(frontend)/layout.tsx',
    'public/robots.txt',
  ];
  const sources = await Promise.all(files.map((file) => readFile(path.join(root, file), 'utf8')));
  assert.ok(sources.every((source) => !source.includes('https://vidsave.ru')));
});
