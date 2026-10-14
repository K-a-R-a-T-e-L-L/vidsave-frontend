import { NextRequest } from 'next/server';
import { forwardCatalogRoute } from '@/shared/admin/admin-catalog-route';

export const dynamic = 'force-dynamic';
export const GET = (request: NextRequest) => forwardCatalogRoute(request, 'categories-list', 'GET');
export const POST = (request: NextRequest) => forwardCatalogRoute(request, 'category-create', 'POST');
