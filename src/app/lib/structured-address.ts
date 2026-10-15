// Extract only explicit components from the current contact settings; no stale defaults.
export function structuredAddress(address: string) {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts.find((part) => /^(?:г\.|город)\s+/iu.test(part));
  const streetIndex = parts.findIndex((part) =>
    /^(?:ул\.|улица|проспект|пр-т|переулок|пер\.|шоссе|площадь|пл\.)\s+/iu.test(part),
  );
  const postalCode = parts.find((part) => /^\d{6}$/.test(part));
  return {
    '@type': 'PostalAddress',
    name: address,
    ...(parts.some((part) => /^(?:Россия|Российская Федерация|RU)$/iu.test(part)) ? { addressCountry: 'RU' } : {}),
    ...(city ? { addressLocality: city.replace(/^(?:г\.|город)\s+/iu, '') } : {}),
    ...(streetIndex >= 0
      ? {
          streetAddress: parts
            .slice(streetIndex)
            .filter((part) => part !== postalCode)
            .join(', '),
        }
      : {}),
    ...(postalCode ? { postalCode } : {}),
  };
}
