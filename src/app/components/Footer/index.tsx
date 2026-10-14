'use client';
import Image from 'next/image';
import BrandLogo from '../BrandLogo';
import Link from 'next/link';
import { useContactData } from '@/app/components/CmsContent';
import { publicNavigation } from '@/app/lib/site';
import styles from './styles.module.scss';

const navigation = [{ href: '/', label: 'Главная' }, ...publicNavigation];

export default function Footer() {
  const { contactData, settings } = useContactData();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Link href="/" className={styles.brand} aria-label="ВИДЕОХРАНИТЕЛЬ — на главную">
            <BrandLogo />
          </Link>
          <nav className={styles.nav} aria-label="Навигация в подвале">
            {navigation.map((item) => (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link className={styles.phone} href={contactData.phoneHref}>
            {contactData.phoneLabel}
          </Link>
        </div>
        <div className={styles.bottom}>
          <p className={styles.legal}>
            {settings.geography}
            <br />
            {contactData.legalName} · ИНН {contactData.inn} · ЕГРИП {contactData.egrip}
            <br />
            {contactData.legalAddress}
          </p>
          <Link className={styles.legalEmail} href={'mailto:' + contactData.legalEmail}>
            {contactData.legalEmail}
          </Link>
          <span className={styles.credit}>
            Проект создан:{' '}
            <Link href="https://el-solo.karatell.ru" target="_blank" rel="noreferrer">
              El Solo
              <Image src="/images/logo_el_solo.png" alt="Логотип разработчика El Solo" width={24} height={24} />
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
