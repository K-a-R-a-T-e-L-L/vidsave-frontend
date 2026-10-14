import { NextRequest } from 'next/server';
import { forwardCatalogRoute } from '@/shared/admin/admin-catalog-route';
import { makeAdminErrorResponse } from '@/shared/admin/forward-admin-request';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return validId(id) ? forwardCatalogRoute(request, 'service-get', 'GET') : makeAdminErrorResponse(404, 'NOT_FOUND');
}
export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return validId(id)
    ? forwardCatalogRoute(request, 'service-update', 'PATCH')
    : makeAdminErrorResponse(404, 'NOT_FOUND');
}

export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return validId(id)
    ? forwardCatalogRoute(request, 'service-delete', 'DELETE')
    : makeAdminErrorResponse(404, 'NOT_FOUND');
}
