import JsonLd from '../JsonLd';
import { absoluteUrl } from '@/app/lib/site';
import { notFound } from 'next/navigation';
import ContentCard from '../ContentCard';
import Link from 'next/link';
import { PageSection, PublicPage, EmptyContentState } from '@/app/components/PublicPage';
import { getContentList } from '@/app/lib/cms';
import styles from '@/app/components/PublicPage/styles.module.scss';

export async function ContentListing({
  kind,
  page = 1,
  search = '',
  category,
  title,
}: {
  kind: 'posts' | 'projects';
  page?: number;
  search?: string;
  category?: string;
  title?: string;
}) {
  const query = new URLSearchParams({ page: String(page), limit: '12' });
  if (search) query.set('search', search);
  if (category) query.set('category', category);
  const [result, categories] = await Promise.all([
    getContentList(kind, query.toString()),
    kind === 'posts' ? getContentList('blog-categories', 'limit=50') : Promise.resolve(null),
  ]);
  if (page > 1 && page > Math.ceil(result.total / result.limit)) notFound();
  const path = kind === 'posts' ? '/blog' : '/projects';
  return (
    <PublicPage
      title={title ?? (kind === 'posts' ? 'Блог' : 'Наши работы')}
      description={
        kind === 'posts'
          ? 'Как выбрать видеонаблюдение, подготовиться к монтажу и обслуживать оборудование. Поможем найти решение для дома или бизнеса.'
          : 'Видеонаблюдение, климат и электрика для жилых и коммерческих объектов. Посмотрите наши работы и обсудите решение для своего объекта.'
      }
      path={category ? `/blog/category/${category}` : path}
    >
      {result.items.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: result.items.map((item, index) => ({
              '@type': 'ListItem',
              position: (page - 1) * result.limit + index + 1,
              name: item.title,
              url: absoluteUrl(path + '/' + item.slug),
            })),
          }}
        />
      )}
      {kind === 'posts' && (
        <>
          <form action={path} className="content-search">
            <label htmlFor="blog-search">Поиск материалов</label>
            <input id="blog-search" name="search" defaultValue={search} maxLength={200} />
            <button type="submit">Найти</button>
          </form>
          <nav aria-label="Категории блога">
            <ul className={styles.filters}>
              <li>
                <Link href="/blog">Все материалы</Link>
              </li>
              {categories?.items.map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/category/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
      {result.total === 0 ? (
        <EmptyContentState
          title={
            search
              ? 'Материалы не найдены'
              : kind === 'posts'
                ? 'Нужна помощь с выбором оборудования?'
                : 'Какое решение подойдёт вашему объекту?'
          }
          text={
            search
              ? 'Попробуйте изменить запрос.'
              : 'Расскажите, что нужно установить или настроить. Обсудим зоны наблюдения, оборудование и состав работ — и поможем сделать следующий шаг.'
          }
        />
      ) : (
        <PageSection title={kind === 'posts' ? 'Публикации' : 'Наши работы'}>
          <div className={styles.grid}>
            {result.items.map((item) => (
              <ContentCard key={item.id} item={item} kind={kind} />
            ))}
          </div>
        </PageSection>
      )}
      {result.total > result.limit && (
        <nav aria-label="Страницы материалов">
          <ul className={styles.filters}>
            {Array.from({ length: Math.ceil(result.total / result.limit) }, (_, index) => {
              const params = new URLSearchParams();
              if (search) params.set('search', search);
              params.set('page', String(index + 1));
              const href = (category ? `/blog/category/${category}` : path) + '?' + params;
              return (
                <li key={index}>
                  <Link href={href} aria-current={page === index + 1 ? 'page' : undefined}>
                    {index + 1}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </PublicPage>
  );
}
