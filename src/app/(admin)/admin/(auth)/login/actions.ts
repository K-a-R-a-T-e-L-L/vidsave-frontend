'use server';

import { redirect } from 'next/navigation';
import {
  AdminBackendHttpError,
  AdminBackendUnavailable,
  assertAdminBackendSuccess,
  readAdminBackendJson,
  requestAdminBackend,
} from '@/shared/api/admin-backend';
import { writeAdminSessionCookies } from '@/shared/admin/session';
import { InvalidAdminBackendResponse, parseAdminAuthResponse } from '@/shared/admin/types';

export interface LoginFormState {
  error?: string;
  retryAfterSeconds?: number;
}

function fieldValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === 'string' ? value : null;
}

export async function loginAdminAction(_previousState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = fieldValue(formData, 'email')?.trim() ?? '';
  const password = fieldValue(formData, 'password') ?? '';

  if (
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0 ||
    password.length > 256
  ) {
    return { error: 'Проверьте email и пароль.' };
  }

  try {
    const response = await requestAdminBackend('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assertAdminBackendSuccess(response);
    const session = parseAdminAuthResponse(await readAdminBackendJson(response));
    await writeAdminSessionCookies(session);
  } catch (error) {
    if (error instanceof AdminBackendHttpError) {
      if (error.status === 401) return { error: 'Неверный email или пароль.' };
      if (error.status === 429) {
        const seconds = error.retryAfterSeconds;
        return {
          error: seconds
            ? `Слишком много попыток. Повторите через ${seconds} сек.`
            : 'Слишком много попыток. Повторите позже.',
          retryAfterSeconds: seconds,
        };
      }
    }
    if (error instanceof AdminBackendUnavailable || error instanceof InvalidAdminBackendResponse) {
      return { error: 'Сервис временно недоступен. Попробуйте позже.' };
    }
    return { error: 'Не удалось выполнить вход. Попробуйте позже.' };
  }

  redirect('/admin');
}
