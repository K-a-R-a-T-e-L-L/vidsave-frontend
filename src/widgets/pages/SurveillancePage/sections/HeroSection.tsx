import { HeroBackdrop, HeroControls } from '@/app/components/LandingPrimitives';
import refresh from '../Refresh.module.scss';
import { IconCamera } from '@tabler/icons-react';
import styles from '../SurveillancePage.module.scss';

export default function HeroSection() {
  return (
    <section className={`${styles.hero} ${refresh.hero}`} aria-labelledby="surveillance-title">
      <HeroBackdrop />
      <div className={`${styles.heroCopy} ${refresh.copy}`}>
        <span className={styles.eyebrow}>Кемерово · выезд по Кузбассу</span>
        <h1 id="surveillance-title">
          Установка
          <br />
          видеонаблюдения
          <br />
          <em>в Кемерово</em>
        </h1>
        <p className={`${styles.lead} ${refresh.lead}`}>
          Видеть, что происходит.
          <br />
          На объекте и когда вас нет рядом.
        </p>
        <p>Подберём камеры, установим и настроим запись — для частного дома, магазина, офиса или склада.</p>
        <HeroControls />
      </div>
      <figure className={`${styles.heroVisual} ${refresh.visual}`}>
        <div
          className={`${styles.heroImage} ${refresh.photo}`}
          role="img"
          aria-label="Иллюстрация камеры видеонаблюдения у современного дома"
        />
        <figcaption>
          <span className={styles.imageLabel}>
            <IconCamera size={18} aria-hidden="true" /> Видеонаблюдение под вашу задачу
          </span>
          <span>Подбор камер, монтаж и настройка записи.</span>
        </figcaption>
      </figure>
    </section>
  );
}
