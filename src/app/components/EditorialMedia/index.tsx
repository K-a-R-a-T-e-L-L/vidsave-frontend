import type { CSSProperties } from 'react';
import MotionArtwork from '@/widgets/pages/SurveillancePage/MotionArtwork.client';
import { crm, pipeline } from './artwork';
import styles from './styles.module.scss';

export function EditorialArt({ kind }: { kind: 'crm' | 'pipeline' }) {
  return (
    <MotionArtwork className={`${styles.art} ${styles[kind]}`}>
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: kind === 'crm' ? crm : pipeline }} />
    </MotionArtwork>
  );
}
export function EditorialPhoto({ kind, alt }: { kind: 'home' | 'business' | 'services' | 'projects'; alt: string }) {
  const stem = `/images/editorial/${kind}`;
  const light = kind === 'projects' ? stem : `${stem}-light`;
  const dark = kind === 'projects' ? stem : `${stem}-dark`;
  return (
    <div
      role="img"
      aria-label={alt}
      className={styles.photo}
      style={
        {
          '--photo-light': `url("${light}-1200.webp")`,
          '--photo-dark': `url("${dark}-1200.webp")`,
          '--photo-small-light': `url("${light}-640.webp")`,
          '--photo-small-dark': `url("${dark}-640.webp")`,
        } as CSSProperties
      }
    />
  );
}
