import type { NextRequest } from 'next/server';
import { forwardAdminRequest } from '@/shared/admin/forward-admin-request';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return forwardAdminRequest(request, 'me');
}
