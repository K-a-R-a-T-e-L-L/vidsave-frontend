import { cmsPageMetadata } from '@/app/lib/cms';
import { PageText } from '@/app/components/CmsContent';
import Link from 'next/link';
import Contacts from '@/app/components/Contacts';
import { PageSection, PublicPage } from '@/app/components/PublicPage';

import { getCmsBootstrap } from '@/app/lib/cms';
import { contactValues } from '@/app/lib/site-contact';

export async function generateMetadata() {
  return cmsPageMetadata(
    'contacts',
    'Контакты «ВИДЕОХРАНИТЕЛЬ» — Кемерово',
    'Телефоны, электронная почта, Telegram, ВКонтакте и адрес компании «ВИДЕОХРАНИТЕЛЬ». Обсуждение работ в Кемерово и Кемеровской области.',
    '/contacts',
  );
}
export default async function Page() {
  const { settings } = await getCmsBootstrap();
  const { companyData, contactData } = contactValues(settings);
  return (
    <PublicPage
      title="Контакты"
      description="Расскажите, что нужно установить или настроить. Поможем выбрать решение и обсудим стоимость работ для вашего дома или бизнеса."
      path="/contacts"
    >
      <Contacts />
      <PageSection title="Дополнительные способы связи">
        <p>
          <Link href={contactData.additionalPhoneHref}>{contactData.additionalPhone}</Link> ·{' '}
          <Link href={`mailto:${contactData.legalEmail}`}>{contactData.legalEmail}</Link>
        </p>
        <p>
          <PageText value={'Пришлите фотографии или план объекта — это поможет точнее обсудить монтаж и оборудование.'}>
            {'Пришлите фотографии или план объекта — это поможет точнее обсудить монтаж и оборудование.'}
          </PageText>
        </p>
      </PageSection>
      <PageSection
        title="География обслуживания"
        description="Кемерово и Кемеровская область — Кузбасс. Сообщите адрес объекта: возможность выезда и состав работ обсуждаются индивидуально."
      />
      <PageSection title="Реквизиты">
        <p>{contactData.legalName}</p>
        <p>
          ИНН {contactData.inn}
          <PageText value={'· ЕГРИП'}>{'· ЕГРИП'}</PageText>
          {contactData.egrip}
        </p>
        <p>{contactData.legalAddress}</p>
      </PageSection>
      <PageSection
        title="Начните с описания задачи"
        description="Подготовьте адрес, сведения об оборудовании и список нужных работ. Выберите удобный способ связи, чтобы обсудить детали."
      >
        <p>
          <Link href={contactData.phoneHref}>
            <PageText value={'Позвонить:'}>{'Позвонить:'}</PageText>
            {contactData.phoneLabel}
          </Link>{' '}
          ·{' '}
          <Link href={`mailto:${companyData.email}`}>
            <PageText value={'Написать:'}>{'Написать:'}</PageText>
            {companyData.email}
          </Link>
        </p>
      </PageSection>
    </PublicPage>
  );
}
