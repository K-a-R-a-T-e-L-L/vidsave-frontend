import { contentResponse } from '@/app/lib/cms';
import { mediaWidths, mediaQualities } from '@/app/lib/media-image';
import { mediaVariant, MediaBusy } from '@/app/lib/media-variants';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'",
};
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404, headers });
  const query = new URL(request.url).searchParams;
  const w = query.get('w'),
    q = query.get('q');
  if (
    [...query.keys()].some((k) => !['w', 'q'].includes(k)) ||
    query.getAll('w').length > 1 ||
    query.getAll('q').length > 1 ||
    (w === null && q !== null) ||
    (w !== null &&
      (!mediaWidths.some((v) => String(v) === w) || !mediaQualities.some((v) => String(v) === (q ?? '85'))))
  )
    return new Response(null, { status: 400, headers });
  try {
    // Deliberately before variant cache: withdrawn/draft images must not leak from a warm cache.
    const response = await contentResponse('media/' + id);
    if (!response.ok) {
      await response.body?.cancel();
      return new Response(null, { status: response.status === 404 ? 404 : 503, headers });
    }
    const input = Buffer.from(await response.arrayBuffer());
    if (input.length > 8 * 1024 * 1024) return new Response(null, { status: 502, headers });
    const bytes = w ? await mediaVariant(input, Number(w), Number(q ?? 85)) : input;
    return new Response(new Uint8Array(bytes), {
      headers: { ...headers, 'Content-Type': 'image/webp', 'Content-Length': String(bytes.length) },
    });
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: { ...headers, ...(error instanceof MediaBusy ? { 'Retry-After': '1' } : {}) },
    });
  }
}
