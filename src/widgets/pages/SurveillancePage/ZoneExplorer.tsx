import { SceneChoice } from '@/app/components/LandingPrimitives';
import Link from 'next/link';
import { IconArrowUpRight } from '@tabler/icons-react';
import Artwork from '@/app/components/Artwork';
import { surveillanceMedia } from '@/app/lib/surveillance-media';
import styles from './ZoneExplorer.module.scss';

const scenarios = [
  {
    key: 'home',
    label: 'Дом и участок',
    title: 'Вход, двор и территория',
    href: '/for-home',
    link: 'Решения для дома',
    image: surveillanceMedia.home,
    zones: [
      {
        title: 'Вход и калитка',
        text: 'Кто подходит к дому и заходит на участок.',
        x: 568,
        y: 505,
        shapes: ['548,395 598,395 609,602 548,602'],
      },
      {
        title: 'Въезд и парковка',
        text: 'Въезд автомобилей и место стоянки.',
        x: 742,
        y: 500,
        shapes: ['626,389 797,389 868,602 635,602'],
      },
      {
        title: 'Двор и границы участка',
        text: 'Подходы к дому, хозяйственные постройки и проходы вдоль ограждения.',
        x: 331,
        y: 495,
        shapes: ['291,192 321,192 233,601 172,601', '286,386 518,386 518,601 238,601'],
      },
    ],
  },
  {
    key: 'business',
    label: 'Бизнес',
    title: 'Посетители, рабочие зоны, въезд',
    href: '/for-business',
    link: 'Решения для бизнеса',
    image: surveillanceMedia.business,
    zones: [
      {
        title: 'Вход и посетители',
        text: 'Кто входит в здание и выходит из него.',
        x: 410,
        y: 480,
        shapes: ['394,360 445,360 435,555 393,555'],
      },
      {
        title: 'Парковка и разгрузка',
        text: 'Движение транспорта, доставка и передача товара.',
        x: 663,
        y: 448,
        shapes: ['549,341 838,344 888,533 458,533 458,383 549,383'],
      },
      {
        title: 'Территория объекта',
        text: 'Подъездные пути, наружные проходы и рабочие площадки.',
        x: 215,
        y: 432,
        shapes: ['245,113 303,113 219,560 129,560'],
      },
    ],
  },
] as const;

// Native radio groups keep both scenarios in SSR HTML and work before hydration / without JS.
export default function ZoneExplorer() {
  return (
    <div className={styles.explorer}>
      <fieldset className={styles.modes}>
        <legend>Выберите тип объекта</legend>
        {scenarios.map((scene, index) => (
          <label key={scene.key}>
            <input type="radio" name="surveillance-object" value={scene.key} defaultChecked={index === 0} />
            <span>{scene.label}</span>
          </label>
        ))}
      </fieldset>
      <div className={styles.panels}>
        {scenarios.map((scene) => (
          <section
            key={scene.key}
            className={styles.panel}
            data-scene={scene.key}
            aria-labelledby={`scene-${scene.key}`}
          >
            <div className={styles.copy}>
              <h3 id={`scene-${scene.key}`}>{scene.title}</h3>
              <fieldset className={styles.zones}>
                <legend>Выберите зону наблюдения</legend>
                {scene.zones.map((zone, index) => (
                  <SceneChoice
                    key={zone.title}
                    id={`${scene.key}-zone-${index}`}
                    name={`${scene.key}-zone`}
                    value={index}
                    index={index}
                    title={zone.title}
                    text={zone.text}
                  />
                ))}
              </fieldset>
              <Link href={scene.href} className={styles.link}>
                {scene.link}
                <IconArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <figure className={styles.visual}>
              <div className={styles.canvas}>
                <Artwork src={scene.image} alt={`Иллюстрация объекта: ${scene.label.toLowerCase()}`} />
                <svg viewBox="0 0 1000 750" aria-hidden="true" className={styles.overlay}>
                  {scene.zones.map((zone, index) => (
                    <g key={zone.title} data-zone={index}>
                      {zone.shapes.map((shape) => (
                        <polygon key={shape} points={shape} />
                      ))}
                    </g>
                  ))}
                </svg>
                {scene.zones.map((zone, index) => (
                  <label
                    key={zone.title}
                    htmlFor={`${scene.key}-zone-${index}`}
                    className={styles.pin}
                    data-zone={index}
                    style={{ left: `${zone.x / 10}%`, top: `${zone.y / 7.5}%` }}
                    title={zone.title}
                  >
                    <span aria-hidden="true">0{index + 1}</span>
                    <span className={styles.srOnly}>{zone.title}</span>
                  </label>
                ))}
              </div>
              <figcaption>Расположение камер подбираем под ваш объект</figcaption>
            </figure>
          </section>
        ))}
      </div>
    </div>
  );
}
