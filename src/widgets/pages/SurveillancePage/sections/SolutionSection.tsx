import refresh from '../Refresh.module.scss';
import { IconCamera, IconNetwork, IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react';
import ZoneExplorer from '../ZoneExplorer';
import styles from '../SurveillancePage.module.scss';

const parts = [
  { icon: IconCamera, title: 'Камеры', text: 'Нужный ракурс и детализация в каждой зоне.', note: 'Видеть' },
  { icon: IconNetwork, title: 'Подключение', text: 'Питание и передача изображения от камер.', note: 'Передавать' },
  {
    icon: IconDeviceDesktop,
    title: 'Регистратор и архив',
    text: 'Запись и хранение событий на накопителе.',
    note: 'Сохранять',
  },
  { icon: IconDeviceMobile, title: 'Просмотр', text: 'На мониторе или удалённо, если есть связь.', note: 'Проверять' },
];
export default function SolutionSection() {
  return (
    <>
      <section id="zones" className={styles.section} aria-labelledby="zones-title">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>01 / Начинаем с объекта</span>
          <h2 id="zones-title">
            Не просто камеры.
            <br />
            <em>Нужные зоны в поле зрения.</em>
          </h2>
          <p>
            Сначала определяем, что важно видеть. Затем выбираем места установки, оборудование и способ подключения.
          </p>
        </div>
        <ZoneExplorer />
      </section>
      <section id="system" className={styles.section} aria-labelledby="system-title">
        <div className={styles.splitHeading}>
          <div>
            <span className={styles.eyebrow}>02 / От изображения до записи</span>
            <h2 id="system-title">
              Как устроено
              <br />
              видеонаблюдение
            </h2>
          </div>
          <p>Камера — только часть решения. Связь, питание и архив должны работать вместе.</p>
        </div>
        <ol className={`${styles.systemFlow} ${refresh.flow}`}>
          {parts.map((part, index) => (
            <li key={part.title}>
              <div className={styles.flowTop}>
                <part.icon size={31} stroke={1.5} aria-hidden="true" />
                <span>0{index + 1}</span>
              </div>
              <small>{part.note}</small>
              <h3>{part.title}</h3>
              <p>{part.text}</p>
            </li>
          ))}
        </ol>
        <div className={styles.systemNote}>
          <strong>Интернет и запись — разные задачи.</strong>
          <p>
            Локальный архив может работать без интернета. Для просмотра с телефона вне объекта понадобится связь.
            Конкретные возможности зависят от оборудования.
          </p>
        </div>
      </section>
    </>
  );
}
