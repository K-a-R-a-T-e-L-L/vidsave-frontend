import { siteMetadata, getCmsBootstrap } from '@/app/lib/cms';
import Image from '@/app/components/MediaImage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedServices } from '@/app/lib/catalog';
import { catalogServicePrice } from '@/app/lib/catalog-format';
import { absoluteUrl, siteConfig, toMetaDescription } from '@/app/lib/site';
import { PageSection, PublicPage, ServicePreview } from '@/app/components/PublicPage';
import styles from '@/app/components/PublicPage/styles.module.scss';
type Props = { params: Promise<{ serviceName: string }> };
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { serviceName } = await params;
  const service = (await getPublishedServices()).find((item) => item.slug === serviceName);
  if (!service) notFound();
  return await siteMetadata(
    service.seoTitle?.trim() || service.name + ' в Кемерово',
    service.seoDescription?.trim() || toMetaDescription(service.name + '. ' + service.description),
    '/services/' + service.slug,
  );
}
export default async function Page({ params }: Props) {
  const { serviceName } = await params;
  const services = await getPublishedServices();
  const service = services.find((item) => item.slug === serviceName);
  if (!service) notFound();
  const { settings } = await getCmsBootstrap();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': absoluteUrl('/services/' + service.slug + '#service'),
    image: service.imagePath ? absoluteUrl(service.imagePath) : undefined,
    name: service.name,
    description: service.description,
    serviceType: service.category.name,
    url: absoluteUrl('/services/' + service.slug),
    areaServed: settings.geography,
    provider: { '@id': siteConfig.url + '/#business' },
    ...(service.priceMode === 'fixed' && service.priceRub !== null
      ? {
          offers: {
            '@type': 'Offer',
            url: absoluteUrl('/services/' + service.slug),
            price: service.priceRub,
            priceCurrency: 'RUB',
            ...(service.unitLabel ? { description: service.unitLabel } : {}),
          },
        }
      : {}),
  };
  const related = services
    .filter((item) => item.id !== service.id && item.category.id === service.category.id)
    .slice(0, 3);
  return (
    <PublicPage
      title={service.name}
      description={service.category.name}
      path={'/services/' + service.slug}
      crumbs={[
        { label: 'Услуги', href: '/services' },
        { label: service.name, href: '/services/' + service.slug },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <section className={styles.detail} aria-label="Состав и стоимость услуги">
        {service.imagePath && (
          <div className={styles.detailImage}>
            <Image
              src={service.imagePath}
              alt={service.imageAlt || service.name}
              fill
              sizes="(max-width: 700px) 90vw, 50vw"
              priority
            />
          </div>
        )}
        <div className={styles.detailCopy}>
          <strong className={styles.price}>{catalogServicePrice(service)}</strong>
          <h2>Описание услуги</h2>
          <p>{service.description}</p>
          {service.details?.trim() && (
            <>
              <h2>Дополнительные сведения</h2>
              <p>{service.details}</p>
            </>
          )}
        </div>
      </section>
      {related.length > 0 && (
        <PageSection title="Другие услуги этого направления">
          <ServicePreview services={related} />
        </PageSection>
      )}
    </PublicPage>
  );
}
