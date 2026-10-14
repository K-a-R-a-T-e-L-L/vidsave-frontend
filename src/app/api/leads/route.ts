import { NextResponse, type NextRequest } from 'next/server';
import { isExpectedFrontendOrigin } from '@/shared/admin/forward-admin-request';
import { contentResponse } from '@/app/lib/cms';
export async function GET() {
  try {
    const response = await contentResponse('lead-config');
    if (!response.ok) throw new Error();
    return NextResponse.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  }
}
export async function POST(request: NextRequest) {
  if (!isExpectedFrontendOrigin(request)) return NextResponse.json({ error: 'CSRF_REJECTED' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.byteLength;
    if (total > 16384) {
      await reader.cancel();
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 413 });
    }
    chunks.push(part.value);
  }
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const response = await contentResponse('leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (response.status === 201) {
      const result = await response.json();
      if (result.accepted === true)
        return NextResponse.json({ accepted: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    }
    const status = [400, 409, 429].includes(response.status) ? response.status : 503;
    return NextResponse.json(
      {
        error:
          status === 429
            ? 'RATE_LIMITED'
            : status === 409
              ? 'CONSENT_CHANGED'
              : status === 400
                ? 'INVALID_INPUT'
                : 'SERVICE_UNAVAILABLE',
      },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'SERVICE_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
