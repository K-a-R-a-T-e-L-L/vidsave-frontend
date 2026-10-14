import 'server-only';
import { cmsEndpoint } from './cms-target';

import { NextResponse, type NextRequest } from 'next/server';
import {
  AdminBackendHttpError,
  AdminBackendUnavailable,
  assertAdminBackendSuccess,
  readAdminBackendJson,
  requestAdminBackend,
} from '@/shared/api/admin-backend';
import { ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_REFRESH_TOKEN_COOKIE } from './session-config';
import { refreshAdminSession } from './refresh';
import { applySessionCookies } from './session-cookies';
import { InvalidAdminBackendResponse, parseAdminProfile } from './types';
import { siteConfig } from '@/app/lib/site';

export type AdminForwardTarget =
  | 'cms-data'
  | 'cms-file'
  | 'me'
  | 'admins-list'
  | 'admins-create'
  | 'services-list'
  | 'service-get'
  | 'service-create'
  | 'service-update'
  | 'service-delete'
  | 'categories-list'
  | 'category-get'
  | 'category-create'
  | 'category-update'
  | 'category-delete';

function jsonResponse(body: unknown, status: number, retryAfterSeconds?: number): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store');
  if (retryAfterSeconds) {
    response.headers.set('Retry-After', String(retryAfterSeconds));
  }
  return response;
}

function safeHttpError(error: AdminBackendHttpError): NextResponse {
  if (error.status === 401) {
    return jsonResponse({ error: 'UNAUTHORIZED' }, 401);
  }
  if (error.status === 403) {
    return jsonResponse({ error: 'FORBIDDEN' }, 403);
  }
  if (error.status === 404) {
    return jsonResponse({ error: 'NOT_FOUND' }, 404);
  }
  if (error.status === 429) {
    return jsonResponse({ error: 'RATE_LIMITED' }, 429, error.retryAfterSeconds);
  }
  if (error.status === 400 || error.status === 409) {
    return jsonResponse({ error: error.status === 409 ? 'ADMIN_CONFLICT' : 'INVALID_INPUT' }, error.status);
  }
  return jsonResponse({ error: 'SERVICE_UNAVAILABLE' }, 503);
}

function endpointFor(target: AdminForwardTarget, request: NextRequest) {
  if (target.startsWith('cms-')) {
    const path = cmsEndpoint(request);
    if (!path) throw new AdminBackendUnavailable();
    return path;
  }
  if (target === 'me') return 'auth/me';
  if (target === 'admins-list' || target === 'admins-create') return 'admins';
  if (target.startsWith('services-') || target.startsWith('service-')) {
    const hasId = target === 'service-get' || target === 'service-update' || target === 'service-delete';
    const suffix = hasId ? `/${request.nextUrl.pathname.split('/').at(-1)}` : '';
    const query = target === 'services-list' ? request.nextUrl.search : '';
    return `services${suffix}${query}`;
  }
  const hasId = target === 'category-get' || target === 'category-update' || target === 'category-delete';
  const suffix = hasId ? `/${request.nextUrl.pathname.split('/').at(-1)}` : '';
  return `service-categories${suffix}`;
}

async function sendBackendRequest(
  request: NextRequest,
  target: AdminForwardTarget,
  accessToken: string,
  payload?: unknown,
  method?: string,
): Promise<Response> {
  return requestAdminBackend(
    endpointFor(target, request) as Parameters<typeof requestAdminBackend>[0],
    {
      method: method ?? (payload ? 'POST' : 'GET'),
      headers: { authorization: `Bearer ${accessToken}` },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    },
    request.nextUrl.pathname === '/api/admin/cms/media' && method === 'POST' ? 30000 : undefined,
  );
}

async function safePayload(response: Response, target: AdminForwardTarget) {
  if (response.status === 204) return null;
  const value: unknown = await readAdminBackendJson(response);
  if (target === 'cms-data') return value;
  if (
    target.startsWith('services-') ||
    target.startsWith('service-') ||
    target.startsWith('categories-') ||
    target.startsWith('category-')
  )
    return value;
  if (target === 'admins-list') {
    if (!Array.isArray(value)) throw new AdminBackendUnavailable();
    return value.map(parseAdminProfile);
  }
  return parseAdminProfile(value);
}

export async function forwardAdminRequest(
  request: NextRequest,
  target: AdminForwardTarget,
  payload?: unknown,
  method?: string,
): Promise<NextResponse> {
  const accessToken = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
  let response: Response | null = null;
  let refreshed = null;

  try {
    if (accessToken) response = await sendBackendRequest(request, target, accessToken, payload, method);

    if (!response || response.status === 401) {
      if (!refreshToken) {
        return jsonResponse({ error: 'UNAUTHORIZED' }, 401);
      }
      refreshed = await refreshAdminSession(refreshToken);
      response = await sendBackendRequest(request, target, refreshed.accessToken, payload, method);
    }

    if (!response.ok) {
      let result: NextResponse;
      try {
        assertAdminBackendSuccess(response);
        result = jsonResponse({ error: 'SERVICE_UNAVAILABLE' }, 503);
      } catch (error) {
        result =
          error instanceof AdminBackendHttpError
            ? safeHttpError(error)
            : jsonResponse({ error: 'SERVICE_UNAVAILABLE' }, 503);
      }
      if (refreshed) applySessionCookies(result, refreshed);
      return result;
    }

    if (target === 'cms-file') {
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 8 * 1024 * 1024) throw new AdminBackendUnavailable();
      const image = new NextResponse(bytes, {
        headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      });
      if (refreshed) applySessionCookies(image, refreshed);
      return image;
    }
    const safeData: unknown = await safePayload(response, target);
    const result =
      response.status === 204
        ? new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
        : jsonResponse(safeData, response.status);
    if (refreshed) applySessionCookies(result, refreshed);
    return result;
  } catch (error) {
    if (error instanceof AdminBackendHttpError) {
      const result = safeHttpError(error);
      if (refreshed) applySessionCookies(result, refreshed);
      return result;
    }
    if (error instanceof AdminBackendUnavailable) {
      return jsonResponse({ error: 'SERVICE_UNAVAILABLE' }, 503);
    }
    if (error instanceof InvalidAdminBackendResponse) {
      return jsonResponse({ error: 'SERVICE_UNAVAILABLE' }, 503);
    }
    // Refresh 401 may be a replay caused by an in-flight rotation elsewhere.
    // Never clear the request cookies here: a successful concurrent response
    // must remain able to replace them in the browser.
    return jsonResponse({ error: 'UNAUTHORIZED' }, 401);
  }
}

export function makeAdminErrorResponse(status: number, error: string): NextResponse {
  return jsonResponse({ error }, status);
}

export function makeUnauthorizedResponse(): NextResponse {
  const response = jsonResponse({ error: 'UNAUTHORIZED' }, 401);
  return response;
}

export function makeCsrfRejectedResponse(): NextResponse {
  return jsonResponse({ error: 'CSRF_REJECTED' }, 403);
}

export function isExpectedFrontendOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  if (parsedOrigin.origin !== origin) return false;

  if (process.env.NODE_ENV === 'production') {
    return parsedOrigin.origin === new URL(process.env.FRONTEND_ORIGIN || siteConfig.url).origin;
  }

  const host = request.nextUrl.hostname.toLowerCase();
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) return false;
  return parsedOrigin.origin === request.nextUrl.origin;
}

export function validateCreateAdminInput(value: unknown): { email: string; password: string } | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !('email' in value) ||
    !('password' in value) ||
    typeof value.email !== 'string' ||
    typeof value.password !== 'string'
  ) {
    return null;
  }

  const email = value.email.trim();
  const password = value.password;
  if (
    email.length === 0 ||
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length > 256 ||
    [...password].length < 14 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return null;
  }
  return { email, password };
}
