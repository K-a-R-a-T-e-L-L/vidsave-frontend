import { NextRequest } from 'next/server';
import { forwardCatalogRoute } from '@/shared/admin/admin-catalog-route';

export const dynamic = 'force-dynamic';
export const GET = (request: NextRequest) => forwardCatalogRoute(request, 'services-list', 'GET');
export const POST = (request: NextRequest) => forwardCatalogRoute(request, 'service-create', 'POST');
