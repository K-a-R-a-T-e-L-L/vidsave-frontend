import { IconArrowRight } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import BrandLogo from '../BrandLogo';
import ReturnTimer from './ReturnTimer';
import styles from './styles.module.scss';

export default function NotFoundPage() {
  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="ВИДЕОХРАНИТЕЛЬ — на главную">
            <BrandLogo />
          </Link>
        </header>
        <div className={styles.scene}>
          <div className={styles.copy}>
            <p className={styles.code}>Ошибка 404</p>
            <h1 id="not-found-title">
              Страница
              <br /> не найдена
            </h1>
            <p className={styles.message}>Возможно, ссылка устарела или в адресе опечатка.</p>
            <Link href="/" replace className={styles.home}>
              На главную <IconArrowRight size={20} aria-hidden="true" />
            </Link>
            <ReturnTimer />
          </div>
          <Image
            className={styles.art}
            src="/images/robot-404.svg"
            unoptimized
            width={476}
            height={394}
            preload
            alt=""
          />
        </div>
      </div>
    </main>
  );
}
