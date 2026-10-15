import localFont from 'next/font/local';

export const manropeCyrillic = localFont({
  src: '../../../node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-manrope-cyrillic',
  adjustFontFallback: false,
  fallback: [],
});

export const manropeLatin = localFont({
  src: '../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-manrope-latin',
  adjustFontFallback: false,
  fallback: [],
});
