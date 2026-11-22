import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import NotFoundPage from './components/NotFoundPage';
import { manropeCyrillic, manropeLatin } from './lib/fonts';

export const metadata: Metadata = {
  title: 'Страница не найдена | ВИДЕОХРАНИТЕЛЬ',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru" {...mantineHtmlProps} className={manropeCyrillic.variable + ' ' + manropeLatin.variable}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" localStorageKey="vidsave_theme" />
      </head>
      <body style={{ margin: 0 }}>
        <NotFoundPage />
      </body>
    </html>
  );
}
