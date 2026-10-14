import type { NextRequest } from 'next/server';
import {
  forwardAdminRequest,
  isExpectedFrontendOrigin,
  makeAdminErrorResponse,
  makeCsrfRejectedResponse,
} from '@/shared/admin/forward-admin-request';
import { cmsEndpoint } from '@/shared/admin/cms-target';
import { ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_REFRESH_TOKEN_COOKIE } from '@/shared/admin/session-config';
export const dynamic = 'force-dynamic';
async function handle(request: NextRequest) {
  if (!cmsEndpoint(request)) return makeAdminErrorResponse(404, 'NOT_FOUND');
  if (request.method !== 'GET' && !isExpectedFrontendOrigin(request)) return makeCsrfRejectedResponse();
  if (!request.cookies.has(ADMIN_ACCESS_TOKEN_COOKIE) && !request.cookies.has(ADMIN_REFRESH_TOKEN_COOKIE))
    return makeAdminErrorResponse(401, 'UNAUTHORIZED');
  const file = request.nextUrl.pathname.endsWith('/file');
  let body: unknown;
  if (['POST', 'PATCH'].includes(request.method)) {
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return makeAdminErrorResponse(400, 'INVALID_INPUT');
    const limit =
      request.method === 'POST' && request.nextUrl.pathname.endsWith('/media') ? 12 * 1024 * 1024 : 512 * 1024;
    let size = 0;
    const chunks: Uint8Array[] = [];
    const reader = request.body?.getReader();
    if (!reader) return makeAdminErrorResponse(400, 'INVALID_INPUT');
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return makeAdminErrorResponse(413, 'INVALID_INPUT');
      }
      chunks.push(part.value);
    }
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return makeAdminErrorResponse(400, 'INVALID_INPUT');
    }
  }
  return forwardAdminRequest(request, file ? 'cms-file' : 'cms-data', body, request.method);
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
