import { getPublishedServices } from '@/app/lib/catalog';
import { audienceContent } from '@/app/lib/public-content';
import { InfoCards, PageFAQ, PageSection, PublicPage, ServicePreview } from '.';

export default async function AudiencePage({ audience }: { audience: keyof typeof audienceContent }) {
  const content = audienceContent[audience];
  const services = await getPublishedServices();
  const selected = content.slugs.flatMap((slug) => {
    const service = services.find((item) => item.slug === slug);
    return service ? [service] : [];
  });
  return (
    <PublicPage title={content.title} description={content.intro} path={content.path} image={content.image}>
      <PageSection
        title={audience === 'home' ? 'Какие зоны дома нужно видеть' : 'Типовые задачи коммерческого объекта'}
      >
        <InfoCards items={[...content.tasks]} />
      </PageSection>
      <PageSection
        title="Подходящие услуги из каталога"
        description="Цены и состав работ берём из опубликованных карточек. Подборку нужно уточнить под оборудование и условия объекта."
      >
        <ServicePreview services={selected} />
      </PageSection>
      <PageSection title={content.approachTitle}>
        <InfoCards items={[...content.approach]} />
      </PageSection>
      <PageSection title={content.benefitTitle} description={content.benefit} />
      <PageFAQ items={[...content.faq]} />
    </PublicPage>
  );
}
