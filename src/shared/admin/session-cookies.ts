import type { NextRequest, NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_REFRESH_TOKEN_COOKIE, adminSessionCookieOptions } from './session-config';
import type { AdminAuthResponse } from './types';

const secureCookies = process.env.NODE_ENV === 'production';

export function applySessionCookies(response: NextResponse, session: AdminAuthResponse): void {
  response.cookies.set(
    ADMIN_ACCESS_TOKEN_COOKIE,
    session.accessToken,
    adminSessionCookieOptions(session.accessExpiresIn, secureCookies),
  );
  response.cookies.set(
    ADMIN_REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    adminSessionCookieOptions(session.refreshExpiresIn, secureCookies),
  );
}

export function applySessionCookiesToRequest(request: NextRequest, session: AdminAuthResponse): void {
  request.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, session.accessToken);
  request.cookies.set(ADMIN_REFRESH_TOKEN_COOKIE, session.refreshToken);
}

export function clearResponseSessionCookies(response: NextResponse): void {
  const expiredOptions = {
    ...adminSessionCookieOptions(1, secureCookies),
    maxAge: 0,
    expires: new Date(0),
  };
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, '', expiredOptions);
  response.cookies.set(ADMIN_REFRESH_TOKEN_COOKIE, '', expiredOptions);
}
