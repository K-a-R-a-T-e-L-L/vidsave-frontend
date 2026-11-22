'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const cityServices = {
  cameras: 'Установка видеонаблюдения',
  purchase: 'Покупка кондиционера с установкой',
  installation: 'Установка своего кондиционера',
  electrical: 'Электромонтажные работы',
  other: 'Другое',
};
type Service = keyof typeof cityServices;
const Context = createContext<{
  city: string;
  service: Service | '';
  select: (service: Service | '') => void;
} | null>(null);

export function CityEnquiryProvider({ city, children }: { city: string; children: ReactNode }) {
  const [service, select] = useState<Service | ''>('');
  useEffect(() => {
    function readServiceAnchor() {
      const key = window.location.hash.slice('#request-'.length);
      if (window.location.hash.startsWith('#request-') && Object.hasOwn(cityServices, key)) select(key as Service);
    }
    readServiceAnchor();
    window.addEventListener('hashchange', readServiceAnchor);
    return () => window.removeEventListener('hashchange', readServiceAnchor);
  }, []);
  return <Context.Provider value={{ city, service, select }}>{children}</Context.Provider>;
}

export const useCityEnquiry = () => useContext(Context);

export function CityEnquiryLink({
  service,
  children,
  className,
}: {
  service: Service;
  children: ReactNode;
  className: string;
}) {
  const enquiry = useCityEnquiry();
  return (
    <a href={'#request-' + service} className={className} onClick={() => enquiry?.select(service)}>
      {children}
    </a>
  );
}
