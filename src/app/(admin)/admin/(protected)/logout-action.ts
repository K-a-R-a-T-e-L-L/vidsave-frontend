'use server';

import { redirect } from 'next/navigation';
import { requestAdminBackend } from '@/shared/api/admin-backend';
import { readAdminCookies, clearAdminSessionCookies } from '@/shared/admin/session';

export async function logoutAdminAction(): Promise<never> {
  const { refreshToken } = await readAdminCookies();
  if (refreshToken) {
    try {
      await requestAdminBackend('auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Local sign-out remains effective even when backend revocation is unavailable.
    }
  }

  await clearAdminSessionCookies();
  redirect('/admin/login');
}
