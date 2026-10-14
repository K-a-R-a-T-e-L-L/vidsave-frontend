import { NextResponse, type NextRequest } from 'next/server';
import {
  forwardAdminRequest,
  isExpectedFrontendOrigin,
  makeCsrfRejectedResponse,
  validateCreateAdminInput,
} from '@/shared/admin/forward-admin-request';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return forwardAdminRequest(request, 'admins-list');
}

export async function POST(request: NextRequest) {
  if (!isExpectedFrontendOrigin(request)) return makeCsrfRejectedResponse();

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    const response = NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const payload = validateCreateAdminInput(input);
  if (!payload) {
    const response = NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  return forwardAdminRequest(request, 'admins-create', payload);
}
