import { siteMetadata } from '@/app/lib/cms';
import { contentPage } from '@/app/lib/content-pagination';
import { ContentListing } from '@/app/components/ContentListing';
import { getContentList } from '@/app/lib/cms';

type Props = { searchParams: Promise<{ page?: string; search?: string }> };
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  const page = contentPage(query.page);
  const list = await getContentList('projects', 'limit=1');
  return {
    ...(await siteMetadata(
      'Наши работы — ВИДЕОХРАНИТЕЛЬ',
      'Опубликованные проекты компании: задачи объектов, выполненные решения и фотографии.',
      '/projects' + (page > 1 ? '?page=' + page : ''),
    )),
    robots: { index: list.total > 0 && !query.search, follow: true, 'max-image-preview': 'large' as const },
  };
}
export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  return <ContentListing kind="projects" page={contentPage(query.page)} search={query.search} />;
}
