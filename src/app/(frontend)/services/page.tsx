import Link from 'next/link';
import { getPublishedCategories, getPublishedServices } from '@/app/lib/catalog';
import { cmsPageMetadata } from '@/app/lib/cms';
import { createPageMetadata } from '@/app/lib/site';
import { PageSection, PublicPage, ServicePreview } from '@/app/components/PublicPage';
import styles from '@/app/components/PublicPage/styles.module.scss';
const pageMetadata = createPageMetadata(
  'Услуги и цены в Кемерово',
  'Каталог услуг «ВИДЕОХРАНИТЕЛЬ»: установка видеонаблюдения, кондиционеры, электромонтаж и настройка оборудования в Кемерово. Цены и состав работ.',
  '/services',
);
type Props = { searchParams: Promise<{ category?: string | string[] }> };
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  const metadata = await cmsPageMetadata(
    'services',
    'Услуги и цены в Кемерово',
    String(pageMetadata.description),
    '/services',
  );
  return { ...metadata, robots: { ...metadata.robots, index: metadata.robots.index && !query.category } };
}
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: Props) {
  const [categories, services, query] = await Promise.all([
    getPublishedCategories(),
    getPublishedServices(),
    searchParams,
  ]);
  const category = categories.find((item) => item.slug === query.category);
  const selected = category ? services.filter((service) => service.category.id === category.id) : services;
  return (
    <PublicPage
      title="Услуги и цены"
      description="Монтаж видеонаблюдения, установка и обслуживание кондиционеров, электромонтажные работы в Кемерово и Кемеровской области. Выберите направление и ознакомьтесь с составом работ."
      path="/services"
    >
      <PageSection title="Выберите нужные работы">
        <nav aria-label="Категории услуг">
          <ul className={styles.filters}>
            <li>
              <Link href="/services" aria-current={!category ? 'true' : undefined}>
                Все услуги
              </Link>
            </li>
            {categories.map((item) => (
              <li key={item.id}>
                <Link
                  href={'/services?category=' + encodeURIComponent(item.slug)}
                  aria-current={category?.id === item.id ? 'true' : undefined}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {query.category && !category && <p>Категория не найдена. Выберите направление из списка ниже.</p>}
        <p>
          {category ? category.name : 'Все направления'} · Услуг: {selected.length}
        </p>
        <ServicePreview services={selected} />
      </PageSection>
      <PageSection
        title="Как выбрать услугу"
        description="Начните с задачи и оборудования на объекте. Цены указаны для отдельных работ с соответствующими единицами; услуги с ценой «от» требуют уточнения состава. Если нужны несколько работ, обсудите их вместе с компанией."
      />
    </PublicPage>
  );
}
