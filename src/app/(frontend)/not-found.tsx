import type { Metadata } from 'next';
import NotFoundPage from '@/app/components/NotFoundPage';

export const metadata: Metadata = {
  title: 'Страница не найдена',
  robots: { index: false },
};

export default NotFoundPage;
