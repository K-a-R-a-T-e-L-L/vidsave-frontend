import { cmsPageMetadata, getContentList } from '@/app/lib/cms';
import Layout from '@/app/components/Layout';
import { siteConfig } from '@/app/lib/site';
import { getPublishedServices, getPublishedCategories } from '@/app/lib/catalog';

export async function generateMetadata() {
  return cmsPageMetadata('home', 'Установка видеонаблюдения в Кемерово', siteConfig.description, '/');
}
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [services, categories, posts, projects] = await Promise.all([
    getPublishedServices(),
    getPublishedCategories(),
    getContentList('posts', 'limit=3'),
    getContentList('projects', 'limit=3'),
  ]);
  return (
    <>
      <Layout services={services} categories={categories} posts={posts.items} projects={projects.items} />
    </>
  );
}
