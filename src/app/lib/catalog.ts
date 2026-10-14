import 'server-only';
import { cache } from 'react';
import type { CatalogCategory, CatalogService } from './catalog-types';

export class CatalogUnavailableError extends Error {
  constructor() {
    super('Public catalog is unavailable');
    this.name = 'CatalogUnavailableError';
  }
}

function backendUrl(path: string): URL {
  const value = process.env.BACKEND_INTERNAL_URL;
  if (!value) throw new CatalogUnavailableError();
  try {
    const base = new URL(value);
    if (base.protocol !== 'http:' && base.protocol !== 'https:') throw new Error();
    return new URL(`/api/catalog/${path}`, base);
  } catch {
    throw new CatalogUnavailableError();
  }
}

async function readJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(backendUrl(path), {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new CatalogUnavailableError();
    return (await response.json()) as T;
  } catch {
    throw new CatalogUnavailableError();
  }
}

export const getPublishedCategories = cache(async (): Promise<CatalogCategory[]> => {
  const value = await readJson<{ items: CatalogCategory[] }>('categories');
  if (!value || !Array.isArray(value.items)) throw new CatalogUnavailableError();
  return value.items;
});

export const getPublishedServices = cache(async (): Promise<CatalogService[]> => {
  const first = await readJson<{ items: CatalogService[]; total: number; page: number; limit: number }>(
    'services?page=1&limit=100',
  );
  if (!first || !Array.isArray(first.items) || !Number.isInteger(first.total)) throw new CatalogUnavailableError();
  const items = [...first.items];
  const pages = Math.ceil(first.total / Math.max(1, first.limit));
  for (let startPage = 2; startPage <= pages; startPage += 20) {
    const batchSize = Math.min(20, pages - startPage + 1);
    const remaining = await Promise.all(
      Array.from({ length: batchSize }, (_, index) =>
        readJson<{ items: CatalogService[] }>(`services?page=${startPage + index}&limit=100`),
      ),
    );
    for (const page of remaining) {
      if (!Array.isArray(page.items)) throw new CatalogUnavailableError();
      items.push(...page.items);
    }
  }
  if (items.length < first.total) throw new CatalogUnavailableError();
  return items;
});
