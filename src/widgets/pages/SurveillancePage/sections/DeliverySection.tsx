import refresh from '../Refresh.module.scss';
import Link from 'next/link';
import { IconArrowUpRight, IconMapPin } from '@tabler/icons-react';
import RepairIllustration from '../RepairIllustration';
import ProcessSignal from '../ProcessSignal.client';
import styles from '../SurveillancePage.module.scss';

const steps = [
  ['Обсуждаем', 'Уточняем задачи, планировку, нужные ракурсы и условия выезда.'],
  ['Согласуем', 'Подбираем оборудование, определяем состав работ и стоимость.'],
  ['Устанавливаем', 'Монтируем камеры, прокладываем линии и настраиваем систему.'],
  ['Проверяем вместе', 'Проверяем изображение и запись, показываем, как пользоваться системой.'],
];
export default function DeliverySection() {
  return (
    <>
      <section
        id="maintenance"
        className={`${styles.maintenance} ${refresh.maintenance}`}
        aria-labelledby="maintenance-title"
      >
        <RepairIllustration />
        <div>
          <span className={styles.eyebrow}>Если система уже есть</span>
          <h2 id="maintenance-title">
            Камеры установлены.
            <br />А всё ли работает?
          </h2>
          <p>
            Нет изображения, пропала запись или нужен доступ с телефона? Опишите симптомы и пришлите модели
            оборудования. Уточним, нужна ли настройка, проверка подключений или замена компонентов.
          </p>
          <Link href="#request" className={styles.textLink}>
            Обсудить обслуживание
            <IconArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className={styles.section} aria-labelledby="process-title">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>04 / От обращения до работающей системы</span>
          <h2 id="process-title">Понятно на каждом этапе</h2>
        </div>
        <ProcessSignal>
          <ol className={`${styles.steps} ${refresh.steps}`}>
            {steps.map(([title, text], index) => (
              <li key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </ProcessSignal>
      </section>
      <aside className={styles.geography}>
        <IconMapPin size={30} stroke={1.5} aria-hidden="true" />
        <div>
          <strong>Кемерово и Кемеровская область</strong>
          <p>
            Укажите населённый пункт в заявке. Возможность, сроки и стоимость выезда согласуем по адресу и объёму работ.
          </p>
        </div>
        <Link href="/contacts">
          Контакты
          <IconArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </aside>
    </>
  );
}
