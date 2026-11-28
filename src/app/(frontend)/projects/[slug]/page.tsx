import JsonLd from '@/app/components/JsonLd';
import { ProjectStory } from '@/app/components/ProjectStory';
import styles from '@/app/components/editorial-detail.module.scss';
import { siteConfig } from '@/app/lib/site';
import { siteMetadata } from '@/app/lib/cms';
import Image from '@/app/components/MediaImage';
import { getContentDetail } from '@/app/lib/cms';
import { toMetaDescription, absoluteUrl } from '@/app/lib/site';
import { PublicPage, PageSection, ServicePreview } from '@/app/components/PublicPage';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getContentDetail('projects', slug);
  const image = item.ogImageUrl || item.coverUrl;
  return siteMetadata(
    item.seoTitle || item.title,
    item.seoDescription || toMetaDescription(item.excerpt),
    `/projects/${item.slug}`,
    image ? { url: image, alt: item.coverAlt || item.title } : undefined,
  );
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const item = await getContentDetail('projects', slug);
  return (
    <PublicPage
      title={item.title}
      description={item.excerpt}
      path={`/projects/${item.slug}`}
      crumbs={[
        { label: 'Наши работы', href: '/projects' },
        { label: item.title, href: `/projects/${item.slug}` },
      ]}
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': absoluteUrl('/projects/' + item.slug + '#project'),
          url: absoluteUrl('/projects/' + item.slug),
          mainEntityOfPage: absoluteUrl('/projects/' + item.slug),
          name: item.title,
          description: item.excerpt,
          inLanguage: 'ru-RU',
          datePublished: item.publishedAt || undefined,
          dateModified: item.updatedAt,
          publisher: { '@id': siteConfig.url + '/#business' },
          image: [
            ...new Set(
              [item.coverUrl, ...(item.galleryIds ?? []).map((id) => '/media/' + id)].filter(
                (url): url is string => !!url,
              ),
            ),
          ].map(absoluteUrl),
          about: item.services?.map((service) => ({
            '@type': 'Service',
            '@id': absoluteUrl('/services/' + service.slug + '#service'),
            name: service.name,
            url: absoluteUrl('/services/' + service.slug),
          })),
        }}
      />
      {item.coverUrl && (
        <Image
          priority
          src={item.coverUrl}
          alt={item.coverAlt || item.title}
          width={1200}
          sizes="(max-width: 760px) 90vw, 1200px"
          height={600}
          className="editorial-cover"
        />
      )}
      <ProjectStory item={item} />
      {!!item.galleryIds?.length && (
        <PageSection id="photos" title="Галерея проекта">
          <div className="project-gallery">
            {item.galleryIds.map((id, index) => {
              const caption = item.gallery?.find((image) => image.id === id)?.alt;
              return (
                <figure key={id} className={styles.figure}>
                  <Image
                    src={`/media/${id}`}
                    alt={caption || `${item.title} — фотография ${index + 1}`}
                    width={600}
                    sizes="(max-width: 760px) 90vw, 50vw"
                    height={400}
                    className="project-gallery-photo"
                  />
                  {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        </PageSection>
      )}
      {!!item.services?.length && (
        <PageSection id="project-services" title="Услуги проекта">
          <ServicePreview services={item.services} compact />
        </PageSection>
      )}
    </PublicPage>
  );
}
