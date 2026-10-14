'use client';

import { useActionState } from 'react';
import { loginAdminAction, type LoginFormState } from './actions';
import styles from './login.module.css';

const initialState: LoginFormState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAdminAction, initialState);

  return (
    <form className={styles.form} action={action}>
      <label className={styles.field}>
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          maxLength={320}
          required
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>
      <label className={styles.field}>
        <span>Пароль</span>
        <input name="password" type="password" autoComplete="current-password" maxLength={256} required />
      </label>
      {state.error ? (
        <p className={styles.error} role="alert" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Проверяем…' : 'Войти'}
      </button>
    </form>
  );
}
