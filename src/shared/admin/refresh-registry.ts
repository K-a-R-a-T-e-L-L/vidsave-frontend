import { createHash } from 'node:crypto';

const registryKey = Symbol.for('vidsave.admin.refresh-inflight.v1');

function getRegistry(): Map<string, Promise<unknown>> {
  const globalRegistry = globalThis as unknown as {
    [key: symbol]: Map<string, Promise<unknown>> | undefined;
  };

  return (globalRegistry[registryKey] ??= new Map());
}

export function singleFlightRefresh<T>(refreshToken: string, operation: () => Promise<T>): Promise<T> {
  const key = createHash('sha256').update(refreshToken).digest('hex');
  const registry = getRegistry();
  const existing = registry.get(key);
  if (existing) return existing as Promise<T>;

  const current: Promise<T> = Promise.resolve()
    .then(operation)
    .finally(() => {
      if (registry.get(key) === current) registry.delete(key);
    });
  registry.set(key, current);
  return current;
}
