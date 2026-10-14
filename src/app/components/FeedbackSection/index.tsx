'use client';
import { IconArrowRight, IconPhone, IconMail } from '@tabler/icons-react';
import { useContactData } from '../CmsContent';
import LeadForm from '../LeadForm';
import styles from './styles.module.scss';
export default function FeedbackSection() {
  const { contactData, companyData } = useContactData();
  return (
    <section id="request" className={styles.section} aria-labelledby="request-title">
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Обсудим вашу задачу</span>
        <h2 id="request-title">Начнём с вашего объекта</h2>
        <p>
          Расскажите, что нужно установить или настроить. Поможем определиться с оборудованием, составом работ и
          следующим шагом.
        </p>
        <div className={styles.steps}>
          <IconArrowRight size={20} aria-hidden="true" />
          <span>Оставьте контакты — обсудим детали и подготовку к работам.</span>
        </div>
        <div className={styles.contacts}>
          <a href={contactData.phoneHref}>
            <IconPhone size={19} />
            <span>
              <small>Можно позвонить</small>
              <strong>{contactData.phoneLabel}</strong>
            </span>
          </a>
          <a href={'mailto:' + companyData.email}>
            <IconMail size={19} />
            <span>
              <small>Или написать</small>
              <strong>{companyData.email}</strong>
            </span>
          </a>
        </div>
      </div>
      <div className={styles.form}>
        <h3>Оставить заявку</h3>
        <p>Имя и телефон — чтобы мы могли вам ответить.</p>
        <LeadForm />
      </div>
    </section>
  );
}
