import HeroPreload from '@/app/components/Home/HeroPreload';
import { brandMetadata } from '@/app/lib/brand-metadata';
import '@/app/styles/public-mantine';
import { CmsProvider } from '@/app/components/CmsContent';
import { getCmsBootstrap } from '@/app/lib/cms';
import { manropeCyrillic, manropeLatin } from '@/app/lib/fonts';
import '@/app/styles/globals.css';
import type { Metadata } from 'next';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import SchemaOrg from '@/app/components/SchemaOrg';
import ThemeProvider from '@/app/components/ThemeProvider';
import { YMCounter } from '@/app/components/YMCounter';
import { siteConfig } from '@/app/lib/site';

const baseMetadata: Metadata = {
  ...brandMetadata,
  title: {
    default: 'Установка видеонаблюдения в Кемерово',
    template: '%s | «ВИДЕОХРАНИТЕЛЬ»',
  },
  description: siteConfig.description,
  authors: [{ name: 'Компания «ВИДЕОХРАНИТЕЛЬ»' }],
  applicationName: siteConfig.name,
  openGraph: {
    title: 'Установка видеонаблюдения в Кемерово | «ВИДЕОХРАНИТЕЛЬ»',
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'ru_RU',
    type: 'website',
    images: [{ url: siteConfig.ogImage, alt: siteConfig.description }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Установка видеонаблюдения в Кемерово | «ВИДЕОХРАНИТЕЛЬ»',
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  metadataBase: new URL(siteConfig.url),
};

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getCmsBootstrap();
  const title = s.seoTitle || 'Установка видеонаблюдения в Кемерово';
  const description = s.seoDescription || siteConfig.description;
  return {
    ...baseMetadata,
    title: { default: title, template: '%s | ' + s.companyName },
    description,
    authors: [{ name: s.companyName }],
    applicationName: s.companyName,
    openGraph: { ...baseMetadata.openGraph, title, description, siteName: s.companyName },
    twitter: { ...baseMetadata.twitter, title, description },
  };
}
export const dynamic = 'force-dynamic';
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getCmsBootstrap();
  const { privacyBody, consentBody, ...publicSettings } = data.settings;
  void privacyBody;
  void consentBody;
  return (
    <html lang="ru" {...mantineHtmlProps} className={`${manropeCyrillic.variable} ${manropeLatin.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" localStorageKey="vidsave_theme" />
        <HeroPreload />
      </head>
      <body>
        <ThemeProvider>
          <CmsProvider data={{ ...data, settings: publicSettings }}>
            <YMCounter />
            <SchemaOrg settings={data.settings} />
            {children}
          </CmsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
