import { getCmsBootstrap } from '@/app/lib/cms';
import { RichContent } from '@/app/components/RichContent';
import { PublicPage } from '@/app/components/PublicPage';
import { createPageMetadata } from '@/app/lib/site';
export const metadata = {
  ...createPageMetadata(
    'Политика обработки данных',
    'Опубликованный документ компании об обработке персональных данных.',
    '/privacy',
  ),
  robots: { index: false, follow: true },
};
export default async function Page() {
  const { settings } = await getCmsBootstrap();
  return (
    <PublicPage
      title="Политика обработки данных"
      description="Документ об обработке персональных данных"
      path="/privacy"
    >
      {settings.privacyPublished ? (
        <RichContent document={settings.privacyBody} />
      ) : (
        <p>Документ пока не опубликован. Для связи используйте телефон и электронную почту компании.</p>
      )}
    </PublicPage>
  );
}
