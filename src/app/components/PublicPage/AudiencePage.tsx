import { getPublishedServices } from '@/app/lib/catalog';
import { audienceContent } from '@/app/lib/public-content';
import { PageFAQ, PageSection, PublicPage, ServicePreview } from '.';
import { WorkJourney, BriefPanel, DirectionLinks, ServiceArea } from '../Editorial';

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
        title={audience === 'home' ? 'Безопасность и комфорт вашего дома' : 'Системы для повседневной работы бизнеса'}
      >
        <DirectionLinks audience={audience} />
      </PageSection>
      {selected.length > 0 && (
        <PageSection
          title="Подходящие услуги из каталога"
          description="Цены и состав работ берём из опубликованных карточек. Подборку нужно уточнить под оборудование и условия объекта."
        >
          <ServicePreview services={selected} compact />
        </PageSection>
      )}
      <PageSection title={content.approachTitle}>
        <WorkJourney items={content.approach} />
      </PageSection>
      <PageSection title={content.benefitTitle} description={content.benefit} />
      <BriefPanel business={audience === 'business'} />
      <PageFAQ
        items={[
          ...content.faq,
          {
            question: 'Можно обратиться со своим кондиционером?',
            answer:
              'Да. Выполняем установку, чистку, заправку, диагностику и ремонт. Пришлите модель и опишите состояние оборудования — обсудим необходимые работы.',
          },
          {
            question: 'Какие электромонтажные работы можно заказать?',
            answer:
              'Прокладку и замену кабелей, сборку и доработку щитов, подключение розеток, освещения и оборудования. Объём и условия работ согласуем по объекту; масштабные промышленные проекты не берём.',
          },
        ]}
      />
      <ServiceArea />
    </PublicPage>
  );
}
