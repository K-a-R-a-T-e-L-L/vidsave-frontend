import type { PublicSettings } from './cms-types';
import { companyData as original, contactData as originalContacts } from './site';
export function phoneHref(value: string) {
  let digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
  return 'tel:+' + digits;
}
export function contactValues(s: PublicSettings) {
  return {
    companyData: {
      ...original,
      name: s.companyName,
      email: s.email,
      telephone: s.phone,
      latitude: s.latitude,
      longitude: s.longitude,
      sameAs: [s.vk, s.avito, s.telegram],
    },
    contactData: {
      ...originalContacts,
      phoneLabel: s.phone,
      phoneHref: phoneHref(s.phone),
      additionalPhone: s.additionalPhone,
      additionalPhoneHref: phoneHref(s.additionalPhone),
      legalEmail: s.additionalEmail,
      addressLabel: s.address,
      mapAddress: s.address,
      legalName: s.legalName,
      legalAddress: s.legalAddress,
      inn: s.inn,
      egrip: s.egrip,
    },
  };
}
