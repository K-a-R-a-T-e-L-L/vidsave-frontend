import { siteMetadata } from '@/app/lib/cms';
import Image from '@/app/components/MediaImage';
import Link from 'next/link';
import { getContentDetail, getContentList } from '@/app/lib/cms';
import { PublicPage, PageSection } from '@/app/components/PublicPage';
import { RichContent } from '@/app/components/RichContent';
import { absoluteUrl, siteConfig, toMetaDescription } from '@/app/lib/site';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getContentDetail('posts', slug);
  const metadata = await siteMetadata(
    item.seoTitle?.trim() || item.title,
    item.seoDescription?.trim() || toMetaDescription(item.excerpt),
    `/blog/${item.slug}`,
  );
  const image = item.ogImageUrl || item.coverUrl;
  const images = image ? [{ url: absoluteUrl(image), alt: item.coverAlt || item.title }] : metadata.openGraph?.images;
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article' as const,
      publishedTime: item.publishedAt || undefined,
      modifiedTime: item.updatedAt,
      images,
    },
    twitter: {
      ...metadata.twitter,
      images: image ? [absoluteUrl(image)] : [absoluteUrl(siteConfig.ogImage)],
    },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const item = await getContentDetail('posts', slug);
  const related = await getContentList('posts', 'limit=4');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: item.title,
    description: item.excerpt,
    datePublished: item.publishedAt,
    dateModified: item.updatedAt,
    url: absoluteUrl(`/blog/${item.slug}`),
    image: item.coverUrl ? absoluteUrl(item.coverUrl) : undefined,
    publisher: { '@id': `${siteConfig.url}/#business` },
    mainEntityOfPage: absoluteUrl(`/blog/${item.slug}`),
    inLanguage: 'ru-RU',
  };
  return (
    <PublicPage
      title={item.title}
      description={item.excerpt}
      path={`/blog/${item.slug}`}
      crumbs={[
        { label: 'Блог', href: '/blog' },
        { label: item.title, href: `/blog/${item.slug}` },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
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
      {item.publishedAt && (
        <p>
          <time dateTime={item.publishedAt}>
            {new Date(item.publishedAt).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}
          </time>
        </p>
      )}
      {item.body && <RichContent document={item.body} />}
      <nav aria-label="Категории статьи">
        {item.categories?.map((category) => (
          <Link key={category.id} href={`/blog/category/${category.slug}`}>
            {category.title} ·{' '}
          </Link>
        ))}
      </nav>
      <PageSection title="Другие материалы">
        {related.items
          .filter((post) => post.id !== item.id)
          .map((post) => (
            <p key={post.id}>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </p>
          ))}
      </PageSection>
    </PublicPage>
  );
}
