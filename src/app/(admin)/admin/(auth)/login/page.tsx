import styles from './login.module.css';
import LoginForm from './login-form';

export default function AdminLoginPage() {
  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <p className={styles.eyebrow}>ВИДЕОХРАНИТЕЛЬ</p>
        <h1 className={styles.title} id="admin-login-title">
          Вход для администратора
        </h1>
        <p className={styles.description}>Войдите с учётной записью администратора сайта.</p>
        <LoginForm />
      </section>
    </main>
  );
}
