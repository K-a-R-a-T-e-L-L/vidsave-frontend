import { cmsPageMetadata, getCmsBootstrap } from '@/app/lib/cms';
import Link from 'next/link';
import Contacts from '@/app/components/Contacts';
import { PageSection, PublicPage } from '@/app/components/PublicPage';
import { WorkJourney } from '@/app/components/Editorial';
import { contactValues } from '@/app/lib/site-contact';
import styles from '@/app/components/Editorial/styles.module.scss';

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
  const { contactData } = contactValues(settings);
  return (
    <PublicPage
      title="Контакты"
      description="Расскажите, что нужно установить или настроить. Поможем выбрать решение и обсудим стоимость работ для вашего дома или бизнеса."
      path="/contacts"
    >
      <Contacts embedded />
      <PageSection
        title="Что поможет обсудить работы точнее"
        description="Необязательно разбираться в оборудовании — достаточно описать задачу. Если есть план или фотографии, приложите их к сообщению в мессенджере или по электронной почте."
      >
        <WorkJourney
          items={[
            {
              title: 'Адрес и объект',
              text: 'Укажите населённый пункт и тип объекта: квартира, дом, офис, магазин или склад. Сообщите об ограничениях доступа.',
            },
            {
              title: 'Задача и оборудование',
              text: 'Расскажите, что нужно установить, настроить или исправить. Если система уже есть, укажите модели и признаки неисправности.',
            },
            {
              title: 'Удобная связь',
              text: 'Оставьте имя и телефон через форму ниже или напишите напрямую. Подробности монтажа и выезда обсудим по вашему обращению.',
            },
          ]}
        />
      </PageSection>
      <PageSection
        title="Выезд по Кузбассу"
        description="Работаем в Кемерово и Кемеровской области. Обсуждаем выезды в Топки, Берёзовский, Ленинск-Кузнецкий, Юргу, Анжеро-Судженск и другие населённые пункты. Укажите свой адрес: возможность, сроки и стоимость выезда согласуем по объёму работ."
      />
      <PageSection title="Дополнительная связь и реквизиты">
        <div className={styles.contactDetails}>
          <div>
            <span className={styles.eyebrow}>По организационным вопросам</span>
            <Link className={styles.contactLink} href={contactData.additionalPhoneHref}>
              {contactData.additionalPhone}
            </Link>
            <Link className={styles.contactLink} href={`mailto:${contactData.legalEmail}`}>
              {contactData.legalEmail}
            </Link>
            <p>Перед поездкой уточните время встречи по телефону.</p>
          </div>
          <dl className={styles.requisites}>
            <div>
              <dt>Наименование</dt>
              <dd>{contactData.legalName}</dd>
            </div>
            <div>
              <dt>ИНН</dt>
              <dd>{contactData.inn}</dd>
            </div>
            <div>
              <dt>ЕГРИП</dt>
              <dd>{contactData.egrip}</dd>
            </div>
            <div>
              <dt>Юридический адрес</dt>
              <dd>{contactData.legalAddress}</dd>
            </div>
          </dl>
        </div>
      </PageSection>
    </PublicPage>
  );
}
