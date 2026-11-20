'use client';

import { useEffect, useRef, useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import styles from './styles.module.scss';

interface MapProps {
  latitude: number;
  longitude: number;
  address: string;
  sizes: string[];
  borderRadius: string;
  title: string;
}

export default function Map({ latitude, longitude, address, sizes, borderRadius, title }: MapProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<'2gis' | 'yandex' | 'address'>('2gis');
  const [loaded, setLoaded] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    if (!('IntersectionObserver' in window)) {
      const frame = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOpen(true);
          observer.disconnect();
        }
      },
      { rootMargin: '700px 0px', threshold: 0 },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open || loaded || provider === 'address') return;
    const timeout = window.setTimeout(() => setProvider(provider === '2gis' ? 'yandex' : 'address'), 10000);
    return () => window.clearTimeout(timeout);
  }, [open, loaded, provider]);

  function switchProvider(next: typeof provider) {
    setLoaded(false);
    setProvider(next);
  }
  // Verified 2GIS company card: address and phone match the site's contacts.
  const options = {
    pos: { lat: latitude, lon: longitude, zoom: 16 },
    opt: { city: 'kemerovo' },
    org: '70000001104099888',
  };
  const mapUrl =
    'https://widgets.2gis.com/widget?type=firmsonmap&options=' + encodeURIComponent(JSON.stringify(options));
  const routeUrl = `https://2gis.ru/kemerovo/directions/points/|${longitude},${latitude}`;
  const point = longitude + ',' + latitude;
  const yandexUrl =
    'https://yandex.ru/map-widget/v1/?' + new URLSearchParams({ ll: point, pt: point + ',pm2rdm', z: '16' });
  return (
    <div ref={container} className={styles.map} style={{ width: sizes[0], height: sizes[1], borderRadius }}>
      <div className={styles.canvas}>
        <Stack className={styles.preview} align="center" gap="md">
          <span className={styles.pin}>
            <IconMapPin size={36} aria-hidden="true" />
          </span>
          <Text fw={700} ta="center">
            {address}
          </Text>
          <Text size="sm" c="dimmed">
            {provider === 'address' ? 'Карта недоступна. Откройте маршрут по ссылке ниже.' : 'Карта проезда'}
          </Text>
        </Stack>
        {open && provider !== 'address' && (
          <iframe
            key={provider}
            title={title}
            src={provider === '2gis' ? mapUrl : yandexUrl}
            style={{ opacity: loaded ? 1 : 0 }}
            width="100%"
            height="100%"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
            onError={() => switchProvider(provider === '2gis' ? 'yandex' : 'address')}
          />
        )}
      </div>
      <div className={styles.actions}>
        {open && (
          <button
            className={styles.switchMap}
            type="button"
            onClick={() => switchProvider(provider === '2gis' ? 'yandex' : '2gis')}
          >
            {provider === '2gis' ? 'Показать Яндекс Карты' : 'Показать карту 2ГИС'}
          </button>
        )}
        <a className={styles.route} href={routeUrl} target="_blank" rel="noopener noreferrer">
          Построить маршрут в 2ГИС ↗
        </a>
      </div>
    </div>
  );
}
