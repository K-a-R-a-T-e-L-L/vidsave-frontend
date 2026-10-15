import type { Metadata } from 'next';

export const siteConfig = {
  url: 'https://vidsave.karatell.ru',
  name: 'ВИДЕОХРАНИТЕЛЬ',
  description:
    'Монтаж систем видеонаблюдения, установка и обслуживание кондиционеров, электромонтажные работы в Кемерово и Кемеровской области.',
  ogImage: '/images/brand/social.jpg',
} as const;

export const companyData = {
  name: 'Торгово-монтажная компания «ВИДЕОХРАНИТЕЛЬ»',
  telephone: '+7-904-574-52-07',
  email: 'mail@khranitelvideo.ru',
  address: {
    streetAddress: 'улица Шестакова, 6А',
    addressLocality: 'Кемерово',
    addressRegion: 'Кемеровская область — Кузбасс',
    addressCountry: 'RU',
  },
  latitude: 55.362173,
  longitude: 86.068001,
  sameAs: [
    'https://vk.com/khranitel_video',
    'https://www.avito.ru/kemerovo/predlozheniya_uslug/videonablyudenie_ustanovkaprodazhaobsluzhivanie_3335539044',
    'https://t.me/deniszaichuk',
  ],
} as const;

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

// Preserve the previously published contact variants without resolving their ambiguity.
export const contactData = {
  phoneLabel: '8-904-574-52-07',
  phoneHref: `tel:${companyData.telephone.replaceAll('-', '')}`,
  additionalPhone: '8-995-065-67-77',
  additionalPhoneHref: 'tel:+79950656777',
  legalEmail: 'denis.zaichuk@yandex.ru',
  addressLabel: 'Россия, г. Кемерово, ул. Шестакова, д. 6А',
  mapAddress: 'Кемерово, Шестакова 6А',
  legalName: 'ИП Зайчук Денис Евгеньевич',
  inn: '423085052501',
  egrip: '324420500109616',
  legalAddress: '650010 Россия, Кемеровская область — Кузбасс, г. Кемерово, ул. Тельбесская, д. 61',
} as const;

export const publicNavigation = [
  { href: '/services', label: 'Услуги' },
  { href: '/for-home', label: 'Для дома' },
  { href: '/for-business', label: 'Для бизнеса' },
  { href: '/projects', label: 'Наши работы' },
  { href: '/blog', label: 'Блог' },
  { href: '/about', label: 'О компании' },
  { href: '/contacts', label: 'Контакты' },
] as const;

export const toMetaDescription = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 155) return normalized;

  const excerpt = normalized.slice(0, 152);
  const lastSpace = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, lastSpace > 0 ? lastSpace : excerpt.length).trimEnd()}…`;
};

export const createPageMetadata = (title: string, description: string, path: string): Metadata => ({
  title,
  description,
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website',
    title: `${title} | «ВИДЕОХРАНИТЕЛЬ»`,
    description,
    url: absoluteUrl(path),
    siteName: siteConfig.name,
    locale: 'ru_RU',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: description }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | «ВИДЕОХРАНИТЕЛЬ»`,
    description,
    images: [siteConfig.ogImage],
  },
});

export const getServiceMetadata = (service: { name: string; description: string; serviceName: string }) =>
  createPageMetadata(
    `${service.name} в Кемерово`,
    toMetaDescription(`${service.name}. ${service.description}`),
    `/services/${service.serviceName}`,
  );

export const buildSitemapEntries = (services: Array<{ serviceName: string }>) => [
  { url: siteConfig.url, changeFrequency: 'weekly' as const, priority: 1 },
  { url: absoluteUrl('/services'), changeFrequency: 'monthly' as const, priority: 0.8 },
  ...['/for-home', '/for-business', '/about', '/contacts'].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  })),
  ...services.map((service) => ({
    url: absoluteUrl(`/services/${service.serviceName}`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })),
];
