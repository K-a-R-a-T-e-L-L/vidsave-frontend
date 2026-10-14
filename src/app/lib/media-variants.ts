import sharp from 'sharp';
import { createHash } from 'node:crypto';
const cache = new Map<string, { bytes: Buffer; expires: number }>();
const pending = new Map<string, Promise<Buffer>>();
let total = 0;
let active = 0;
const queue: Array<() => void> = [];
async function slot() {
  if (active >= 4) await new Promise<void>((resolve) => queue.push(resolve));
  else active++;
}
function release() {
  const next = queue.shift();
  if (next) next();
  else active--;
}

const maxBytes = 32 * 1024 * 1024;
export class MediaBusy extends Error {}
// Cache transformed bytes only. The route must verify publication on EVERY request first.
export async function mediaVariant(input: Buffer, width: number, quality: number): Promise<Buffer> {
  const key = createHash('sha256').update(input).digest('hex') + ':' + width + ':' + quality;
  const now = Date.now();
  for (const [k, v] of cache)
    if (v.expires <= now) {
      total -= v.bytes.length;
      cache.delete(k);
    }
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit.bytes;
  }
  const running = pending.get(key);
  if (running) return running;
  if (pending.size >= 64) throw new MediaBusy();
  const task = slot()
    .then(() =>
      sharp(input, { limitInputPixels: 25_000_000 })
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, alphaQuality: 100, effort: 4 })
        .toBuffer()
        .finally(release),
    )
    .then((bytes) => {
      if (bytes.length <= maxBytes) {
        while (total + bytes.length > maxBytes || cache.size >= 128) {
          const oldest = cache.keys().next().value;
          if (!oldest) break;
          total -= cache.get(oldest)!.bytes.length;
          cache.delete(oldest);
        }
        cache.set(key, { bytes, expires: Date.now() + 300_000 });
        total += bytes.length;
      }
      return bytes;
    })
    .finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}
