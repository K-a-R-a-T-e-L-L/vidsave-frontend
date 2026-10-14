import { getCmsBootstrap } from '@/app/lib/cms';
import { RichContent } from '@/app/components/RichContent';
import { PublicPage } from '@/app/components/PublicPage';
import { createPageMetadata } from '@/app/lib/site';

export const metadata = {
  ...createPageMetadata(
    'Согласие на обработку персональных данных',
    'Согласие на обработку данных заявки в «ВИДЕОХРАНИТЕЛЬ».',
    '/consent',
  ),
  robots: { index: false, follow: true },
};

export default async function Page() {
  const { settings } = await getCmsBootstrap();
  return (
    <PublicPage
      title="Согласие на обработку персональных данных"
      description="Для обращения через форму заявки"
      path="/consent"
    >
      <RichContent document={settings.consentBody} />
    </PublicPage>
  );
}
