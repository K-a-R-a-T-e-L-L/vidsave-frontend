import 'server-only';

import { ADMIN_REQUEST_TIMEOUT_MS, parseBackendInternalUrl } from '@/shared/admin/session-config';

export type AdminBackendEndpoint =
  | 'auth/login'
  | 'auth/refresh'
  | 'auth/logout'
  | 'auth/me'
  | 'admins'
  | `cms/${string}`
  | `services${string}`
  | `service-categories${string}`;

export class AdminBackendHttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(`Administrator backend responded with HTTP ${status}`);
    this.name = 'AdminBackendHttpError';
  }
}

export class AdminBackendUnavailable extends Error {
  constructor() {
    super('Administrator backend is unavailable');
    this.name = 'AdminBackendUnavailable';
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const value = response.headers.get('retry-after');
  if (!value || !/^\d{1,5}$/.test(value)) return undefined;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 86_400 ? seconds : undefined;
}

export function assertAdminBackendSuccess(response: Response): void {
  if (response.status >= 300 && response.status < 400) {
    throw new AdminBackendUnavailable();
  }
  if (!response.ok) {
    throw new AdminBackendHttpError(response.status, parseRetryAfter(response));
  }
}

export async function readAdminBackendJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new AdminBackendUnavailable();
  }
}

export async function requestAdminBackend(
  endpoint: AdminBackendEndpoint,
  init: RequestInit = {},
  timeoutMs = ADMIN_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  let url: URL;
  try {
    const base = parseBackendInternalUrl(process.env.BACKEND_INTERNAL_URL);
    url = new URL(`/api/admin/${endpoint}`, base);
  } catch {
    throw new AdminBackendUnavailable();
  }

  try {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    const response = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(Math.min(30000, timeoutMs)),
    });
    if (response.status >= 300 && response.status < 400) {
      throw new AdminBackendUnavailable();
    }
    return response;
  } catch (error) {
    if (error instanceof AdminBackendUnavailable) throw error;
    throw new AdminBackendUnavailable();
  }
}
