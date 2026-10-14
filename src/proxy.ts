import { NextRequest, NextResponse } from 'next/server';
import { AdminBackendHttpError, AdminBackendUnavailable } from '@/shared/api/admin-backend';
import { refreshAdminSession } from '@/shared/admin/refresh';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
  isAccessTokenNearExpiry,
} from '@/shared/admin/session-config';
import { applySessionCookies, applySessionCookiesToRequest } from '@/shared/admin/session-cookies';

function goToLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/admin/login') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  const accessToken = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
  if (!isAccessTokenNearExpiry(accessToken)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }
  if (!refreshToken) return goToLogin(request);

  let session;
  try {
    session = await refreshAdminSession(refreshToken);
  } catch (error) {
    if (error instanceof AdminBackendHttpError && error.status === 401) {
      return goToLogin(request);
    }
    // An unavailable backend does not prove that the session is invalid.
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    if (error instanceof AdminBackendUnavailable) return response;
    return response;
  }

  applySessionCookiesToRequest(request, session);
  const headers = new Headers(request.headers);
  headers.set('cookie', request.cookies.toString());
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  applySessionCookies(response, session);
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
