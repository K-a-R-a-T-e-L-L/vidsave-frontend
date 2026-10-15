import JsonLd from '../JsonLd';
import { pageMedia } from '@/app/lib/page-media';
import FeedbackSection from '../FeedbackSection';
import type { ReactNode } from 'react';
import Image from '@/app/components/MediaImage';
import Link from 'next/link';
import { absoluteUrl } from '@/app/lib/site';
import type { CatalogService } from '@/app/lib/catalog-types';
import { catalogServicePrice } from '@/app/lib/catalog-format';
import Header from '../Header';
import Footer from '../Footer';
import { PageText, CmsTitle, CmsIntro, ManagedSection, EditableImage, EditableFaq } from '@/app/components/CmsContent';
import styles from './styles.module.scss';

export type Crumb = { label: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs = [{ label: 'Главная', href: '/' }, ...items];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <nav aria-label="Хлебные крошки" className={styles.breadcrumbs}>
        <ol>
          {crumbs.map((item, index) => (
            <li key={item.href}>
              {index === crumbs.length - 1 ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function PageHero({
  title,
  description,
  image,
  imageAlt,
}: {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <div className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>ВИДЕОХРАНИТЕЛЬ · Кемерово</span>
        <h1>
          <CmsTitle value={title} />
        </h1>
        <p>
          <CmsIntro value={description} />
        </p>
      </div>
      {image && (
        <div className={styles.heroImage}>
          <EditableImage
            src={image}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1400px) 40vw, 560px"
            priority
          />
        </div>
      )}
    </div>
  );
}

export function PublicPage({
  title,
  description,
  path,
  image,
  crumbs,
  children,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  crumbs?: Crumb[];
  children: ReactNode;
}) {
  return (
    <div className="public-site">
      <Header />
      <main className={styles.main} id="main-content">
        <Breadcrumbs items={crumbs ?? [{ label: title, href: path }]} />
        <PageHero
          title={title}
          description={description}
          image={pageMedia[path]?.src ?? image}
          imageAlt={pageMedia[path]?.alt}
        />
        {children}
        <FeedbackSection />
      </main>
      <Footer />
    </div>
  );
}

export function PageSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <ManagedSection className={styles.section} title={title}>
      <div className={styles.heading}>
        <h2>
          <PageText value={title} />
        </h2>
        {description && (
          <p>
            <PageText value={description} />
          </p>
        )}
      </div>
      {children}
    </ManagedSection>
  );
}

export function InfoCards({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article className={styles.infoCard} key={item.title}>
          <h3>
            <PageText value={item.title} />
          </h3>
          <p>
            <PageText value={item.text} />
          </p>
        </article>
      ))}
    </div>
  );
}

export function ServicePreview({ services }: { services: CatalogService[] }) {
  return services.length ? (
    <div className={styles.grid}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: services.map((service, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: service.name,
            url: absoluteUrl('/services/' + service.slug),
          })),
        }}
      />
      {services.map((service) => (
        <article className={styles.card} key={service.id}>
          {service.imagePath && (
            <Link href={`/services/${service.slug}`} className={styles.cardImage} aria-label={service.name}>
              <Image
                src={service.imagePath}
                quality={75}
                alt={service.imageAlt || service.name}
                fill
                sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw"
              />
            </Link>
          )}
          <div className={styles.cardBody}>
            <span className={styles.eyebrow}>{service.category.name}</span>
            <h3>
              <Link href={`/services/${service.slug}`}>{service.name}</Link>
            </h3>
            <p>{service.description}</p>
            <strong>{catalogServicePrice(service)}</strong>
            <Link className={styles.textLink} href={`/services/${service.slug}`}>
              Подробнее об услуге →
            </Link>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <p>Не нашли подходящую услугу? Расскажите о своей задаче — подберём необходимые работы для вашего объекта.</p>
  );
}

export function PageFAQ({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <PageSection title="Вопросы и ответы">
      <EditableFaq fallback={items} />
    </PageSection>
  );
}

export function EmptyContentState({ title, text }: { title: string; text: string }) {
  return (
    <section className={styles.empty}>
      <span className={styles.eyebrow}>Раздел готовится</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
