'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Refresh.module.scss';

// Observe only the decorative signal; server-rendered content is never hidden.
export default function ProcessSignal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.dataset.entered = 'true';
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={styles.processReveal}>
      {children}
    </div>
  );
}
