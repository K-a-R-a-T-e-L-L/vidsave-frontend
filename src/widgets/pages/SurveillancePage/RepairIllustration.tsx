import MotionArtwork from './MotionArtwork.client';
import { repairArtwork } from './repair-artwork';
import styles from './RepairIllustration.module.scss';
export default function RepairIllustration() {
  return (
    <MotionArtwork className={styles.art}>
      <div dangerouslySetInnerHTML={{ __html: repairArtwork }} />
    </MotionArtwork>
  );
}
