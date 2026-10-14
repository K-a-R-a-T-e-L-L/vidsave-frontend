import type { Settings } from '@/app/lib/cms-types';
import { siteConfig } from '@/app/lib/site';

const SchemaOrg = ({ settings }: { settings: Settings }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteConfig.url}/#business`,
    name: settings.companyName,
    url: siteConfig.url,
    logo: { '@type': 'ImageObject', url: `${siteConfig.url}/images/brand/mark.webp`, width: 512, height: 512 },
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    description: settings.seoDescription || siteConfig.description,
    telephone: settings.phone,
    email: settings.email,
    address: settings.address,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: settings.latitude,
      longitude: settings.longitude,
    },
    areaServed: settings.geography,
    sameAs: [settings.vk, settings.avito, settings.telegram].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
};

export default SchemaOrg;
