import { redirect } from 'next/navigation';
import { AdminPageBackendUnavailable, AdminUnauthenticated, requireAdmin } from '@/shared/admin/require-admin';
import { AdminProfileProvider } from '@/shared/admin/admin-profile-context';
import Link from 'next/link';
import { logoutAdminAction } from './logout-action';
import styles from '../(auth)/login/login.module.css';
import { AdminShell } from '@/shared/admin/admin-shell';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminUnauthenticated) redirect('/admin/login');
    if (error instanceof AdminPageBackendUnavailable) {
      return (
        <main className={styles.main}>
          <section className={styles.card} role="status">
            <h1 className={styles.title}>Сервис временно недоступен</h1>
            <p className={styles.description}>Не удалось проверить сессию. Попробуйте обновить страницу позже.</p>
            <Link href="/admin">Повторить попытку</Link>
            <form action={logoutAdminAction}>
              <button className={styles.logout} type="submit">
                Выйти на этом устройстве
              </button>
            </form>
          </section>
        </main>
      );
    }
    throw error;
  }

  return (
    <AdminProfileProvider profile={profile}>
      <AdminShell>{children}</AdminShell>
    </AdminProfileProvider>
  );
}
