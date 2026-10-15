import { siteMetadata } from '@/app/lib/cms';
import { contentPage } from '@/app/lib/content-pagination';
import { getContentDetail, getContentList } from '@/app/lib/cms';

import { ContentListing } from '@/app/components/ContentListing';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getContentDetail('blog-categories', slug);
  const query = await searchParams;
  const page = contentPage(query.page);
  const list = await getContentList('posts', `category=${encodeURIComponent(slug)}&limit=1`);
  return {
    ...(await siteMetadata(
      category.seoTitle || category.title,
      category.seoDescription || category.excerpt || `Материалы раздела «${category.title}».`,
      `/blog/category/${slug}${page > 1 ? '?page=' + page : ''}`,
    )),
    robots: { index: list.total > 0, follow: true, 'max-image-preview': 'large' as const },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getContentDetail('blog-categories', slug);
  const query = await searchParams;
  return <ContentListing kind="posts" category={slug} title={category.title} page={contentPage(query.page)} />;
}
