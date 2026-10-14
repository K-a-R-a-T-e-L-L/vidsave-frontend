import { siteMetadata } from '@/app/lib/cms';
import { contentPage } from '@/app/lib/content-pagination';
import { ContentListing } from '@/app/components/ContentListing';
import { getContentList } from '@/app/lib/cms';

type Props = { searchParams: Promise<{ page?: string; search?: string }> };
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  const page = contentPage(query.page);
  const list = await getContentList('posts', 'limit=1');
  return {
    ...(await siteMetadata(
      'Блог о видеонаблюдении и монтаже',
      'Опубликованные материалы компании о видеонаблюдении, монтаже и обслуживании.',
      '/blog' + (page > 1 ? '?page=' + page : ''),
    )),
    robots: { index: list.total > 0 && !query.search, follow: true },
  };
}
export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  return <ContentListing kind="posts" page={contentPage(query.page)} search={query.search} />;
}
