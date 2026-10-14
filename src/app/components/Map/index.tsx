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
  // Verified 2GIS company card: address and phone match the site's contacts.
  const options = {
    pos: { lat: latitude, lon: longitude, zoom: 16 },
    opt: { city: 'kemerovo' },
    org: '70000001104099888',
  };
  const mapUrl =
    'https://widgets.2gis.com/widget?type=firmsonmap&options=' + encodeURIComponent(JSON.stringify(options));
  const routeUrl = `https://2gis.ru/kemerovo/directions/points/|${longitude},${latitude}`;
  return (
    <div ref={container} className={styles.map} style={{ width: sizes[0], height: sizes[1], borderRadius }}>
      {open ? (
        <>
          <div className={styles.canvas}>
            <iframe
              title={title}
              src={mapUrl}
              width="100%"
              height="100%"
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </>
      ) : (
        <Stack className={styles.preview} align="center" gap="md">
          <span className={styles.pin}>
            <IconMapPin size={36} aria-hidden="true" />
          </span>
          <Text fw={700} ta="center">
            {address}
          </Text>
          <Text size="sm" c="dimmed">
            2ГИС · карта проезда
          </Text>
        </Stack>
      )}
      <a className={styles.route} href={routeUrl} target="_blank" rel="noopener noreferrer">
        Построить маршрут в 2ГИС ↗
      </a>
    </div>
  );
}
