import Link from 'next/link';
import { logoutAdminAction } from './logout-action';
import styles from './catalog.module.css';

export function AdminNav() {
  return (
    <nav
      aria-label="Навигация администратора"
      className={styles.actions}
      style={{ padding: '14px 24px', borderBottom: '1px solid #e2e6eb', background: '#fff' }}
    >
      <Link href="/admin">Главная</Link>
      <Link href="/admin/services">Услуги</Link>
      <Link href="/admin/service-categories">Категории</Link>
      <form action={logoutAdminAction}>
        <button className={`${styles.button} ${styles.secondary}`} type="submit">
          Выйти
        </button>
      </form>
    </nav>
  );
}
