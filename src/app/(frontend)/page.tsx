import { cmsPageMetadata, getContentList } from '@/app/lib/cms';
import JsonLd from '@/app/components/JsonLd';
import Layout from '@/app/components/Layout';
import { siteConfig } from '@/app/lib/site';
import { getPublishedServices, getPublishedCategories } from '@/app/lib/catalog';

export async function generateMetadata() {
  return cmsPageMetadata(
    'home',
    'Видеонаблюдение, кондиционеры и электромонтаж в Кузбассе',
    siteConfig.description,
    '/',
  );
}
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [services, categories, posts, projects] = await Promise.all([
    getPublishedServices(),
    getPublishedCategories(),
    getContentList('posts', 'limit=3&placement=home'),
    getContentList('projects', 'limit=3&placement=home'),
  ]);
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': siteConfig.url + '/#website',
          url: siteConfig.url + '/',
          name: siteConfig.name,
          inLanguage: 'ru-RU',
          publisher: { '@id': siteConfig.url + '/#business' },
        }}
      />
      <Layout services={services} categories={categories} posts={posts.items} projects={projects.items} />
    </>
  );
}
