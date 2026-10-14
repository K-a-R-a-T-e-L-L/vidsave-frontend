import { brandMetadata } from '@/app/lib/brand-metadata';
import type { Metadata } from 'next';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import '@fontsource-variable/manrope';
import '@/app/styles/globals.css';
import './admin.css';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import ThemeProvider from '@/app/components/ThemeProvider';
import { Notifications } from '@mantine/notifications';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  ...brandMetadata,
  title: 'Администрирование | «ВИДЕОХРАНИТЕЛЬ»',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" localStorageKey="vidsave_theme" />
      </head>
      <body>
        <ThemeProvider>
          <Notifications position="top-right" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
