import { siteMetadata } from '@/app/lib/cms';
import Image from '@/app/components/MediaImage';
import { getContentDetail } from '@/app/lib/cms';
import { toMetaDescription, absoluteUrl } from '@/app/lib/site';
import { PublicPage, PageSection, ServicePreview } from '@/app/components/PublicPage';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getContentDetail('projects', slug);
  const metadata = await siteMetadata(
    item.seoTitle || item.title,
    item.seoDescription || toMetaDescription(item.excerpt),
    `/projects/${item.slug}`,
  );
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images:
        item.ogImageUrl || item.coverUrl
          ? [{ url: absoluteUrl(item.ogImageUrl || item.coverUrl!) }]
          : metadata.openGraph?.images,
    },
  };
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
      {item.coverUrl && (
        <Image
          src={item.coverUrl}
          alt={item.coverAlt || item.title}
          width={1200}
          sizes="(max-width: 760px) 90vw, 1200px"
          height={600}
          style={{ width: '100%', height: 'auto', borderRadius: 24, marginTop: 32 }}
        />
      )}
      <PageSection title="Объект" description={item.objectType} />
      <PageSection title="Задача" description={item.task} />
      <PageSection title="Выполненное решение" description={item.solution} />
      <PageSection title="Результат" description={item.result} />
      {!!item.galleryIds?.length && (
        <PageSection title="Галерея проекта">
          <div className="project-gallery">
            {item.galleryIds.map((id, index) => (
              <Image
                key={id}
                src={`/media/${id}`}
                alt={item.gallery?.find((image) => image.id === id)?.alt || `${item.title} — фотография ${index + 1}`}
                width={600}
                sizes="(max-width: 760px) 90vw, 50vw"
                height={400}
                style={{ width: '100%', height: 'auto', borderRadius: 16 }}
              />
            ))}
          </div>
        </PageSection>
      )}
      {!!item.services?.length && (
        <PageSection title="Услуги проекта">
          <ServicePreview services={item.services} />
        </PageSection>
      )}
    </PublicPage>
  );
}
