import { allPublishedContent, getCmsBootstrap } from '@/app/lib/cms';
import { absoluteUrl } from '@/app/lib/site';
import { buildSitemapEntries } from '@/app/lib/site';
import { getPublishedServices } from '@/app/lib/catalog';

export const dynamic = 'force-dynamic';

const sitemap = async () => {
  const [services, posts, projects, categories, bootstrap] = await Promise.all([
    getPublishedServices(),
    allPublishedContent('posts'),
    allPublishedContent('projects'),
    allPublishedContent('blog-categories'),
    getCmsBootstrap(),
  ]);
  const base = buildSitemapEntries(services.map((service) => ({ serviceName: service.slug }))).filter(
    (entry) =>
      !bootstrap.pages.some(
        (page) => page.noindex && entry.url === absoluteUrl(page.id === 'home' ? '/' : '/' + page.id),
      ),
  );
  return [
    ...base,
    ...(posts.length ? [{ url: absoluteUrl('/blog') }] : []),
    ...(projects.length ? [{ url: absoluteUrl('/projects') }] : []),
    ...posts.map((post) => ({ url: absoluteUrl('/blog/' + post.slug), lastModified: new Date(post.updatedAt) })),
    ...projects.map((project) => ({
      url: absoluteUrl('/projects/' + project.slug),
      lastModified: new Date(project.updatedAt),
    })),
    ...categories
      .filter((category) => posts.some((post) => post.categories?.some((c) => c.id === category.id)))
      .map((category) => ({
        url: absoluteUrl('/blog/category/' + category.slug),
        lastModified: new Date(category.updatedAt),
      })),
  ];
};

export default sitemap;
