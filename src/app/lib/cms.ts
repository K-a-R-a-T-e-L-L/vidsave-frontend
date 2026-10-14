import 'server-only';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { CmsBootstrap, ContentItem, ContentList } from './cms-types';
import { createPageMetadata } from './site';

export class ContentUnavailable extends Error {
  constructor() {
    super('Содержимое сайта временно недоступно');
  }
}
export async function contentResponse(path: string, init: RequestInit = {}) {
  const base = process.env.BACKEND_INTERNAL_URL;
  if (!base) throw new ContentUnavailable();
  try {
    return await fetch(new URL(`/api/content/${path}`, base), {
      ...init,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ContentUnavailable();
  }
}
async function json<T>(path: string): Promise<T> {
  const response = await contentResponse(path);
  if (!response.ok) throw new ContentUnavailable();
  try {
    return (await response.json()) as T;
  } catch {
    throw new ContentUnavailable();
  }
}
export const getCmsBootstrap = cache(async () => {
  const data = await json<CmsBootstrap>('bootstrap');
  if (!data.settings || !Array.isArray(data.pages)) throw new ContentUnavailable();
  return data;
});
export const getContentList = cache(async (kind: 'posts' | 'projects' | 'blog-categories', query = '') =>
  json<ContentList>(`${kind}${query ? '?' + query : ''}`),
);
export const getContentDetail = cache(async (kind: 'posts' | 'projects' | 'blog-categories', slug: string) => {
  const response = await contentResponse(`${kind}/${encodeURIComponent(slug)}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new ContentUnavailable();
  return (await response.json()) as ContentItem;
});
export async function siteMetadata(title: string, description: string, path: string): Promise<Metadata> {
  const { settings } = await getCmsBootstrap();
  const metadata = createPageMetadata(title, description, path);
  const brandTitle = title + ' | «' + settings.companyName + '»';
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, title: brandTitle, siteName: settings.companyName },
    twitter: { ...metadata.twitter, title: brandTitle },
  };
}
export async function cmsPageMetadata(id: string, fallbackTitle: string, fallbackDescription: string, path: string) {
  void id;
  return { ...(await siteMetadata(fallbackTitle, fallbackDescription, path)), robots: { index: true, follow: true } };
}
export async function allPublishedContent(kind: 'posts' | 'projects' | 'blog-categories') {
  const first = await getContentList(kind, 'limit=50&page=1');
  const items = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / first.limit); page++)
    items.push(...(await getContentList(kind, `limit=50&page=${page}`)).items);
  return items;
}
