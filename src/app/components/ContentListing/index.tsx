import JsonLd from '../JsonLd';
import { ProjectGuide, DirectionLinks, BriefPanel } from '../Editorial';
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
      title={title ?? (kind === 'posts' ? 'Практика: камеры, климат и электрика' : 'Наши работы')}
      description={
        kind === 'posts'
          ? 'Выбор видеонаблюдения, установка и обслуживание кондиционеров, подготовка к электромонтажу. Разборы оборудования и практические материалы для дома и бизнеса.'
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
          <form action={category ? `/blog/category/${category}` : path} className={styles.search}>
            <label htmlFor="blog-search">Поиск материалов</label>
            <input
              id="blog-search"
              type="search"
              placeholder="Например: запись с камер, чистка кондиционера"
              name="search"
              defaultValue={search}
              maxLength={200}
            />
            <button type="submit">Найти</button>
            {search && <Link href={category ? `/blog/category/${category}` : path}>Сбросить</Link>}
          </form>
          <p role="status">
            Найдено материалов: {result.total}
            {search && <> по запросу «{search}»</>}
          </p>
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
                : 'Проекты ещё не опубликованы'
          }
          text={
            search
              ? 'Попробуйте более короткий запрос: камера, кондиционер или кабель. Можно сбросить поиск и посмотреть все опубликованные материалы.'
              : kind === 'projects'
                ? 'Здесь появятся фотографии и описание выполненных работ. Пока можно посмотреть направления и обсудить задачу для своего объекта.'
                : 'Расскажите, что нужно установить или настроить. Обсудим зоны наблюдения, оборудование и состав работ — и поможем сделать следующий шаг.'
          }
        />
      ) : (
        <PageSection title={kind === 'posts' ? 'Публикации' : 'Опубликованные проекты'}>
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
      {kind === 'projects' && (
        <>
          <ProjectGuide />
          <PageSection title="Какие задачи можно обсудить">
            <DirectionLinks />
          </PageSection>
          <BriefPanel business />
        </>
      )}
    </PublicPage>
  );
}
