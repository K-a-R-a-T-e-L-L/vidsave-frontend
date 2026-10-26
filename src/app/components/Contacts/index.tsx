'use client';
import { IconAt, IconArrowUpRight, IconBrandTelegram, IconBrandVk, IconMapPin, IconPhone } from '@tabler/icons-react';
import Link from 'next/link';
import { useContactData } from '@/app/components/CmsContent';
import Map from '../Map';
import styles from './styles.module.scss';

export default function Contacts({ embedded = false }: { embedded?: boolean }) {
  const { companyData, contactData, settings } = useContactData();
  const contacts = [
    {
      label: 'Телефон',
      value: contactData.phoneLabel,
      href: contactData.phoneHref,
      icon: <IconPhone size={20} aria-hidden="true" />,
    },
    {
      label: 'Электронная почта',
      value: companyData.email,
      href: `mailto:${companyData.email}`,
      icon: <IconAt size={20} aria-hidden="true" />,
    },
    {
      label: 'Telegram',
      value: 'Написать в Telegram',
      href: companyData.sameAs[2],
      icon: <IconBrandTelegram size={20} aria-hidden="true" />,
    },
    {
      label: 'ВКонтакте',
      value: 'Страница компании',
      href: companyData.sameAs[0],
      icon: <IconBrandVk size={20} aria-hidden="true" />,
    },
    {
      label: 'Авито',
      value: 'Страница компании',
      href: companyData.sameAs[1],
      icon: <IconArrowUpRight size={20} aria-hidden="true" />,
    },
  ];
  return (
    <section
      className={`${styles.contacts} ${embedded ? styles.embedded : ''}`}
      id="contacts"
      aria-labelledby="contacts-title"
    >
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Контакты</span>
          <h2 id="contacts-title">Будем на связи</h2>
          {settings.hours && <p>{settings.hours}</p>}
          <p>Выберите удобный способ связаться с компанией.</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.contactList}>
            {contacts
              .filter((contact) => !!contact.href)
              .map((contact) => (
                <Link
                  className={styles.contactCard}
                  href={contact.href}
                  key={contact.label}
                  target={contact.href.startsWith('https://') ? '_blank' : undefined}
                  rel={contact.href.startsWith('https://') ? 'noreferrer' : undefined}
                >
                  <span className={styles.icon}>{contact.icon}</span>
                  <span className={styles.contactText}>
                    <span className={styles.label}>{contact.label}</span>
                    <span className={styles.value}>{contact.value}</span>
                  </span>
                </Link>
              ))}
            <div className={styles.address}>
              <IconMapPin size={20} aria-hidden="true" />
              <span>{contactData.addressLabel}</span>
            </div>
          </div>
          <div className={styles.map}>
            <Map
              latitude={companyData.latitude}
              longitude={companyData.longitude}
              address={contactData.mapAddress}
              title={'Карта: ' + contactData.mapAddress}
              sizes={['100%', '100%']}
              borderRadius="24px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
