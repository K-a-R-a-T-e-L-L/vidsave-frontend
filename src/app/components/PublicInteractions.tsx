'use client';
import { useEffect } from 'react';

/** Progressive enhancement: native details and all answer text remain server rendered. */
export default function PublicInteractions() {
  useEffect(() => {
    const running = new Map<HTMLDetailsElement, Animation>();
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const summary = event.target.closest('summary');
      const details = summary?.parentElement;
      if (!(details instanceof HTMLDetailsElement) || !details.closest('.public-site') || !summary) return;
      if (event.target.closest('a,button,input') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      const opening = details.dataset.expanding !== 'true' && (!details.open || details.dataset.expanding === 'false');
      running.get(details)?.cancel();
      details.dataset.expanding = String(opening);
      details.open = true;
      const end = opening ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      details.style.overflow = 'hidden';
      const animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
        duration: 300,
        easing: 'cubic-bezier(.22,1,.36,1)',
      });
      running.set(details, animation);
      animation.onfinish = () => {
        details.open = opening;
        details.style.removeProperty('overflow');
        delete details.dataset.expanding;
        running.delete(details);
      };
    };
    const drag = (event: DragEvent) => {
      if (event.target instanceof Element && event.target.closest('.public-site img')) event.preventDefault();
    };
    document.addEventListener('click', click);
    document.addEventListener('dragstart', drag);
    return () => {
      document.removeEventListener('click', click);
      document.removeEventListener('dragstart', drag);
      running.forEach((animation, details) => {
        animation.cancel();
        details.style.removeProperty('overflow');
        delete details.dataset.expanding;
      });
    };
  }, []);
  return null;
}
