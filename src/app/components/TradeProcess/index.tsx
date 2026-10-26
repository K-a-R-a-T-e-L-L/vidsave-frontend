import MotionArtwork from '@/widgets/pages/SurveillancePage/MotionArtwork.client';
import { artwork as wind } from './wind';
import { artwork as data } from './data';
import styles from './styles.module.scss';
export default function TradeProcess({ kind }: { kind: 'climate' | 'electrical' }) {
  return (
    <MotionArtwork className={`${styles.art} ${kind === 'climate' ? styles.wind : styles.data}`}>
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: kind === 'climate' ? wind : data }} />
    </MotionArtwork>
  );
}
