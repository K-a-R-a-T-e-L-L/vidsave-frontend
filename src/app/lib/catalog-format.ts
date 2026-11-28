import type { CatalogService } from './catalog-types';

const legacyDirections: Record<string, string> = {
  'ustanovka-i-nastroika-sistem-videonablyudeniya': 'surveillance',
  'ustanovka-videoregistratorov': 'surveillance',
  'videonablyudenie-i-zapis': 'surveillance',
  'montazh-i-obsluzhivanie-kondicionerov': 'climate',
  kondicionery: 'climate',
  'elektromontazhnye-raboty': 'electrical',
};
export function servicesForDirection(services: CatalogService[], direction: 'surveillance' | 'electrical' | 'climate') {
  return services.filter(({ category }) => (category.direction ?? legacyDirections[category.slug]) === direction);
}

export function catalogServicePrice(
  service: Pick<CatalogService, 'priceMode' | 'priceRub' | 'unitLabel' | 'tariffs'>,
): string {
  const format = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
  if (service.tariffs?.length) {
    const prices = service.tariffs.map((row) => Number(row.priceRub));
    const low = Math.min(...prices),
      high = Math.max(...prices);
    const range = low === high ? format.format(low) : format.format(low) + '–' + format.format(high);
    return range + ' ₽' + (service.unitLabel ? ' / ' + service.unitLabel : '');
  }
  if (service.priceMode === 'on_request') return 'Цена по запросу';
  if (!service.priceRub) return 'Цена уточняется';
  const amount = format.format(Number(service.priceRub));
  const prefix = service.priceMode === 'from' ? 'от ' : '';
  return `${prefix}${amount} ₽${service.unitLabel ? ` / ${service.unitLabel}` : ''}`;
}
