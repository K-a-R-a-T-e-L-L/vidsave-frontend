import type { CatalogService } from './catalog-types';

export function catalogServicePrice(service: Pick<CatalogService, 'priceMode' | 'priceRub' | 'unitLabel'>): string {
  if (service.priceMode === 'on_request') return 'Цена по запросу';
  if (!service.priceRub) return 'Цена уточняется';
  const amount = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(service.priceRub));
  const prefix = service.priceMode === 'from' ? 'от ' : '';
  return `${prefix}${amount} ₽${service.unitLabel ? ` / ${service.unitLabel}` : ''}`;
}
