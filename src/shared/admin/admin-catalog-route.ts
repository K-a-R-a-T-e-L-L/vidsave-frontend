import { type NextRequest } from 'next/server';
import {
  forwardAdminRequest,
  isExpectedFrontendOrigin,
  makeAdminErrorResponse,
  makeCsrfRejectedResponse,
  type AdminForwardTarget,
} from './forward-admin-request';

export async function forwardCatalogRoute(
  request: NextRequest,
  target: AdminForwardTarget,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
) {
  if (method !== 'GET' && !isExpectedFrontendOrigin(request)) {
    return makeCsrfRejectedResponse();
  }
  let body: unknown;
  if (method === 'POST' || method === 'PATCH') {
    try {
      body = await request.json();
    } catch {
      return makeAdminErrorResponse(400, 'INVALID_INPUT');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return makeAdminErrorResponse(400, 'INVALID_INPUT');
    }
  }
  return forwardAdminRequest(request, target, body, method);
}
