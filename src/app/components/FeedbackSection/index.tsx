'use client';
import { IconBrandTelegram, IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';
import { useContactData } from '../CmsContent';
import Link from 'next/link';
import LeadForm from '../LeadForm';
import styles from './styles.module.scss';
export default function FeedbackSection() {
  const { contactData, settings } = useContactData();
  return (
    <section id="request" className={styles.section} aria-labelledby="request-title">
      <div className={styles.intro}>
        <h2 id="request-title">Обсудим ваш объект</h2>
        <p>
          Работаем в Кемерово и Кемеровской области. Укажите адрес и задачу — согласуем состав работ и стоимость выезда.
        </p>
        <div className={styles.contacts}>
          <a href={contactData.phoneHref}>
            <IconPhone size={19} />
            <span>
              <small>Телефон</small>
              <strong>{contactData.phoneLabel}</strong>
            </span>
          </a>
          <a href={'mailto:' + settings.email}>
            <IconMail size={19} />
            <span>
              <small>Почта</small>
              <strong>{settings.email}</strong>
            </span>
          </a>
          {settings.telegram && (
            <a href={settings.telegram} target="_blank" rel="noopener noreferrer">
              <IconBrandTelegram size={19} aria-hidden="true" />
              <strong>Написать в Telegram</strong>
            </a>
          )}
        </div>
        {contactData.addressLabel && (
          <div className={styles.address}>
            <IconMapPin size={19} aria-hidden="true" />
            <div>
              <span>{contactData.addressLabel}</span>
              <Link href="/contacts#karta">Посмотреть на карте</Link>
            </div>
          </div>
        )}
      </div>
      <div className={styles.form}>
        <h3>Оставить заявку</h3>
        <LeadForm />
      </div>
    </section>
  );
}
