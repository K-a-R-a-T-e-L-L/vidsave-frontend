import type { NextRequest } from 'next/server';
const resources = new Set(['posts', 'projects', 'blog-categories', 'contacts', 'media', 'leads', 'dashboard']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function cmsEndpoint(request: NextRequest) {
  const prefix = '/api/admin/cms/';
  if (!request.nextUrl.pathname.startsWith(prefix)) return null;
  const parts = request.nextUrl.pathname.slice(prefix.length).split('/');
  const [kind, id, file] = parts;
  if (!resources.has(kind) || parts.length > 3 || parts.some((p) => !p)) return null;
  if (id && !uuid.test(id)) return null;
  if (kind === 'media' && request.method === 'GET' && !file) return null;
  if (kind === 'media' && request.method === 'PATCH') return null;
  if (file && !(kind === 'media' && file === 'file' && request.method === 'GET')) return null;
  if (request.method === 'POST' && (id || !['posts', 'projects', 'blog-categories', 'media'].includes(kind)))
    return null;
  if (request.method === 'PATCH' && (!(id || kind === 'contacts') || ['dashboard', 'seo'].includes(kind))) return null;
  if (request.method === 'DELETE' && (!id || !['media', 'blog-categories', 'posts', 'projects'].includes(kind)))
    return null;
  const params = new URLSearchParams();
  for (const key of ['page', 'limit', 'search', 'status']) {
    const v = request.nextUrl.searchParams.get(key);
    if (v) params.set(key, v.slice(0, 200));
  }
  return `cms/${parts.join('/')}${params.size ? '?' + params : ''}`;
}
