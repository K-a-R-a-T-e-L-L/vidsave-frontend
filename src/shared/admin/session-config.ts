export const ADMIN_ACCESS_TOKEN_COOKIE = 'vidsave_admin_access_token';
export const ADMIN_REFRESH_TOKEN_COOKIE = 'vidsave_admin_refresh_token';
export const ADMIN_ACCESS_TOKEN_DEFAULT_TTL_SECONDS = 240;
export const ADMIN_REFRESH_TOKEN_DEFAULT_TTL_SECONDS = 3600;
export const ADMIN_REFRESH_EARLY_SECONDS = 15;
export const ADMIN_REQUEST_TIMEOUT_MS = 5_000;

export function parseBackendInternalUrl(value: string | undefined): URL {
  if (!value) throw new Error('BACKEND_INTERNAL_URL is required');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('BACKEND_INTERNAL_URL must be an absolute HTTP(S) URL');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('BACKEND_INTERNAL_URL is invalid');
  }

  return url;
}

export function adminSessionCookieOptions(maxAge: number, secure: boolean) {
  if (!Number.isSafeInteger(maxAge) || maxAge <= 0) {
    throw new Error('Cookie maxAge must be a positive integer');
  }

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge,
  };
}

export const isAccessTokenNearExpiry = (token: string | undefined, now = Date.now()): boolean => {
  if (!token) return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { exp?: unknown };
    return (
      typeof payload.exp !== 'number' ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp * 1000 <= now + ADMIN_REFRESH_EARLY_SECONDS * 1000
    );
  } catch {
    return true;
  }
};
