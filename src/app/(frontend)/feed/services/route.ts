import { getPublishedCategories, getPublishedServices } from '@/app/lib/catalog';
import type { CatalogCategory } from '@/app/lib/catalog-types';
import { siteConfig } from '@/app/lib/site';
import { getCmsBootstrap } from '@/app/lib/cms';

export const dynamic = 'force-dynamic';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function stableNumericId(uuid: string): number {
  const prefix = Number.parseInt(uuid.replaceAll('-', '').slice(0, 8), 16);
  return (prefix % 2_000_000_000) + 1;
}

function categoryIds(categories: CatalogCategory[]): Map<string, number> {
  const used = new Set<number>();
  const entries = categories
    .map((category) => ({
      category,
      base: category.legacyFeedId ?? stableNumericId(category.id),
    }))
    .sort((a, b) => a.category.slug.localeCompare(b.category.slug));
  const ids = new Map<string, number>();
  for (const { category, base } of entries) {
    let id = base;
    while (used.has(id)) id = id === 2_000_000_000 ? 1 : id + 1;
    used.add(id);
    ids.set(category.id, id);
  }
  return ids;
}

export async function GET() {
  const [categories, services, { settings }] = await Promise.all([
    getPublishedCategories(),
    getPublishedServices(),
    getCmsBootstrap(),
  ]);
  const ids = categoryIds(categories);
  const activeServices = services.filter((service) => service.priceRub && ids.has(service.category.id));
  const serviceId = (service: (typeof activeServices)[number]) => service.legacyId ?? stableNumericId(service.id);
  const sets = activeServices
    .map(
      (service) =>
        `<set id="set_${serviceId(service)}"><name>${escapeXml(service.name)}</name><url>${siteConfig.url}/services/${encodeURIComponent(service.slug)}</url></set>`,
    )
    .join('');
  const offers = activeServices
    .map((service) => {
      const image = service.imagePath
        ? `<picture>${escapeXml(new URL(service.imagePath, siteConfig.url).toString())}</picture>`
        : '';
      const unit =
        service.unitLabel === 'м' ? 'Погонный метр' : service.unitLabel ? escapeXml(service.unitLabel) : 'Услуга';
      const legacyServiceTypes: Record<string, string> = {
        'Установка и настройка систем видеонаблюдения': 'security',
        'Монтаж и обслуживание кондиционеров': 'airconditioning',
        'Установка видеорегистраторов': 'security_dvr_nvr',
        'Электромонтажные работы': 'electrical',
        'Установка и настройка роутеров': 'network_router',
        'Замена жёсткого диска': 'security_hdd_replace',
        'Подключение POE коммутатора': 'network_poe_switch',
      };
      const params = `<param name="Регион">${escapeXml(settings.geography)}</param><param name="unit">${unit}</param>${legacyServiceTypes[service.category.name] ? `<param name="service_type">${legacyServiceTypes[service.category.name]}</param>` : ''}`;
      return `<offer id="${serviceId(service)}"><name>${escapeXml(settings.companyName)}</name><url>${siteConfig.url}/services/${encodeURIComponent(service.slug)}</url><price>${service.priceRub}</price><currencyId>RUB</currencyId><categoryId>${ids.get(service.category.id)}</categoryId><set-ids>set_${serviceId(service)}</set-ids>${image}<description>${escapeXml(service.description.split('.')[0] ?? service.description)}</description><adult>false</adult>${params}</offer>`;
    })
    .join('');
  const categoryXml = categories
    .map((category) => `<category id="${ids.get(category.id)}">${escapeXml(category.name)}</category>`)
    .join('');
  const yml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<yml_catalog date="${new Date().toISOString().slice(0, 10)} 00:00"><shop><name>${escapeXml(settings.companyName)}</name><company>${escapeXml(settings.companyName)}</company><url>${siteConfig.url}</url><email>${escapeXml(settings.email)}</email><currencies><currency id="RUB" rate="1"/></currencies><categories>${categoryXml}</categories><sets>${sets}</sets><offers>${offers}</offers></shop></yml_catalog>`;
  return new Response(yml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
