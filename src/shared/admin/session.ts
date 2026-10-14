import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_REFRESH_TOKEN_COOKIE, adminSessionCookieOptions } from './session-config';
export { applySessionCookies, applySessionCookiesToRequest, clearResponseSessionCookies } from './session-cookies';
import type { AdminAuthResponse } from './types';

const secureCookies = process.env.NODE_ENV === 'production';

export async function readAdminCookies() {
  const store = await cookies();
  return {
    accessToken: store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: store.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
}

export async function writeAdminSessionCookies(session: AdminAuthResponse): Promise<void> {
  const store = await cookies();
  store.set(
    ADMIN_ACCESS_TOKEN_COOKIE,
    session.accessToken,
    adminSessionCookieOptions(session.accessExpiresIn, secureCookies),
  );
  store.set(
    ADMIN_REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    adminSessionCookieOptions(session.refreshExpiresIn, secureCookies),
  );
}

export async function clearAdminSessionCookies(): Promise<void> {
  const store = await cookies();
  const expiredOptions = {
    ...adminSessionCookieOptions(1, secureCookies),
    maxAge: 0,
    expires: new Date(0),
  };
  store.set(ADMIN_ACCESS_TOKEN_COOKIE, '', expiredOptions);
  store.set(ADMIN_REFRESH_TOKEN_COOKIE, '', expiredOptions);
}
