'use client';
import BrandLogo from '../BrandLogo';
import Link from 'next/link';
import { useContactData } from '@/app/components/CmsContent';
import styles from './styles.module.scss';
const groups = [
  {
    title: 'Направления',
    links: [
      ['/videonablyudenie', 'Видеонаблюдение'],
      ['/kondicionery', 'Кондиционеры'],
      ['/elektromontazh', 'Электромонтаж'],
      ['/services', 'Все услуги и цены'],
    ],
  },
  {
    title: 'Для вашего объекта',
    links: [
      ['/for-home', 'Для дома'],
      ['/for-business', 'Для бизнеса'],
      ['/projects', 'Наши работы'],
    ],
  },
  {
    title: 'Компания',
    links: [
      ['/', 'Главная'],
      ['/about', 'О компании'],
      ['/blog', 'Блог'],
      ['/contacts', 'Контакты'],
    ],
  },
  {
    title: 'Документы',
    links: [
      ['/privacy', 'Политика конфиденциальности'],
      ['/consent', 'Согласие на обработку данных'],
    ],
  },
];
export default function Footer() {
  const { contactData, settings } = useContactData();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.identity}>
            <Link href="/" className={styles.brand} aria-label="ВИДЕОХРАНИТЕЛЬ — на главную">
              <BrandLogo />
            </Link>
            <p>{settings.geography}</p>
            <Link className={styles.phone} href={contactData.phoneHref}>
              {contactData.phoneLabel}
            </Link>
            <Link className={styles.email} href={'mailto:' + contactData.legalEmail}>
              {contactData.legalEmail}
            </Link>
          </div>
          <nav className={styles.nav} aria-label="Навигация в подвале">
            {groups.map((group) => (
              <div key={group.title} className={styles.group}>
                <h2>{group.title}</h2>
                <ul>
                  {group.links.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} ВИДЕОХРАНИТЕЛЬ
            <br />
            {contactData.legalName} · ИНН {contactData.inn} · ЕГРИП {contactData.egrip}
            <br />
            {contactData.legalAddress}
          </p>
          <a
            className={styles.credit}
            href="https://storyset.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Иллюстрации — Storyset"
          >
            Storyset ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
