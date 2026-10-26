import MotionArtwork from '@/widgets/pages/SurveillancePage/MotionArtwork.client';
import { robotArtwork } from './artwork';
import styles from './styles.module.scss';
export default function RobotProcess() {
  return (
    <MotionArtwork className={styles.robot}>
      <div dangerouslySetInnerHTML={{ __html: robotArtwork }} />
    </MotionArtwork>
  );
}
