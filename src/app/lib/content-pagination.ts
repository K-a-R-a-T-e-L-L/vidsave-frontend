export function contentPage(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{1,4}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
