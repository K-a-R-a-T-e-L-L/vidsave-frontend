import Link from 'next/link';
import {
  IconCamera,
  IconSnowflake,
  IconBolt,
  IconArrowUpRight,
  IconMapPin,
  IconClipboardList,
  IconSettings,
  IconCheck,
} from '@tabler/icons-react';
import Artwork from '../Artwork';
import { SceneChoice } from '../LandingPrimitives';
import styles from './styles.module.scss';
export function DirectionLinks({ audience }: { audience?: 'home' | 'business' } = {}) {
  const items = [
    {
      href: '/videonablyudenie',
      title: 'Видеть нужные зоны',
      text:
        audience === 'home'
          ? 'Вход, ворота, двор и проходы: подберём камеры под нужную детализацию, настроим запись и просмотр с телефона. Можно доработать существующую систему.'
          : audience === 'business'
            ? 'Входы, парковка и разгрузка, рабочие зоны: определим ракурсы, глубину архива и доступ сотрудников. Учтём существующие камеры и подключения.'
            : 'Камеры, запись и просмотр. От подбора ракурса до настройки системы.',
      icon: IconCamera,
      label: 'Видеонаблюдение',
    },
    {
      href: '/kondicionery',
      title: 'Настроить комфорт',
      text:
        audience === 'home'
          ? 'Подбор места для кондиционера в спальне или гостиной, монтаж, чистка и диагностика. Работаем и с вашим оборудованием.'
          : audience === 'business'
            ? 'Кондиционеры для офиса, магазина и рабочих помещений. Установка, чистка, диагностика и ремонт с согласованием доступа.'
            : 'Установка кондиционера, обслуживание и помощь с уже работающей системой.',
      icon: IconSnowflake,
      label: 'Кондиционеры',
    },
    {
      href: '/elektromontazh',
      title: 'Подключить оборудование',
      text:
        audience === 'home'
          ? 'Проводка, сборка щита, розетки, освещение дома и участка. Состав работ согласуем с учётом отделки и нагрузок.'
          : audience === 'business'
            ? 'Кабельные линии, щиты, освещение и точки питания для рабочих мест и оборудования. Без масштабных промышленных работ.'
            : 'Кабельные линии, щиты, освещение и точки подключения.',
      icon: IconBolt,
      label: 'Электромонтаж',
    },
  ];
  return (
    <div className={styles.directions}>
      {items.map(({ icon: Icon, ...item }, i) => (
        <Link className={styles.direction} key={item.href} href={item.href}>
          <div className={styles.topline}>
            <Icon size={30} />
            <span>0{i + 1}</span>
          </div>
          <small>{item.label}</small>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          <span className={styles.link}>
            Подробнее о направлении <IconArrowUpRight size={18} />
          </span>
        </Link>
      ))}
    </div>
  );
}
export function ObjectExplorer({
  audience,
  items,
}: {
  audience: 'home' | 'business';
  items: readonly { title: string; text: string }[];
}) {
  const points =
    audience === 'home'
      ? [
          [61, 69],
          [78, 67],
          [30, 63],
        ]
      : [
          [39, 60],
          [68, 65],
          [18, 40],
        ];
  return (
    <div className={styles.object}>
      <fieldset>
        <legend>Выберите задачу объекта</legend>
        {items.map((item, i) => (
          <SceneChoice
            key={item.title}
            id={`${audience}-task-${i}`}
            name={`${audience}-task`}
            value={i + 1}
            index={i}
            title={item.title}
            text={item.text}
          />
        ))}
      </fieldset>
      <figure>
        <div className={styles.scene}>
          <Artwork
            src={`/images/surveillance/${audience}-v2`}
            alt={
              audience === 'home'
                ? 'Иллюстрация дома с входом, двором и парковкой'
                : 'Иллюстрация коммерческого здания с входом и территорией'
            }
          />
          {points.map(([x, y], i) => (
            <label
              className={styles.pin}
              data-zone={i + 1}
              style={{ left: `${x}%`, top: `${y}%` }}
              htmlFor={`${audience}-task-${i}`}
              key={i}
              aria-label={items[i].title}
            >
              0{i + 1}
            </label>
          ))}
        </div>
        <figcaption>Расположение камер подбираем под ваш объект</figcaption>
      </figure>
    </div>
  );
}
export function WorkJourney({ items }: { items: readonly { title: string; text: string }[] }) {
  const icons = [IconClipboardList, IconSettings, IconCheck];
  return (
    <ol className={styles.journey}>
      {items.map((item, i) => {
        const Icon = icons[i % icons.length];
        return (
          <li key={item.title}>
            <div className={styles.topline}>
              <span>0{i + 1}</span>
              <Icon size={28} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </li>
        );
      })}
    </ol>
  );
}
export function BriefPanel({ business = false }: { business?: boolean }) {
  return (
    <aside className={styles.brief}>
      <div>
        <span className={styles.eyebrow}>До первого расчёта</span>
        <h2>{business ? 'План объекта — начало разговора.' : 'Покажите, что важно для вас.'}</h2>
        <p>Необязательно знать модели оборудования. Начнём с задачи и уточним детали вместе.</p>
        <Link className={styles.link} href="#request">
          Обсудить мой объект <IconArrowUpRight size={18} />
        </Link>
      </div>
      <ul>
        {(business
          ? [
              'Адрес, тип помещения и режим работы',
              'Зоны наблюдения и имеющееся оборудование',
              'План, фотографии и ограничения доступа',
            ]
          : ['Адрес и тип дома', 'Какие зоны хотите видеть', 'Фотографии участка и сведения об оборудовании']
        ).map((text, i) => (
          <li key={text}>
            <span>0{i + 1}</span>
            {text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
export function ServiceArea() {
  return (
    <div className={styles.area}>
      <div>
        <IconMapPin size={28} />
        <span className={styles.eyebrow}>Кемерово · Кузбасс</span>
        <h2>Начнём с вашего адреса</h2>
        <p>
          Кемерово, Топки, Берёзовский, Ленинск-Кузнецкий, Юрга, Анжеро-Судженск. Это не полный список: возможность,
          сроки и стоимость выезда в другие населённые пункты обсуждаем по задаче.
        </p>
        <Link className={styles.link} href="/contacts">
          Контакты и карта <IconArrowUpRight size={18} />
        </Link>
      </div>
      <Artwork src="/images/surveillance/region" alt="Декоративная иллюстрация географии работ в Кузбассе" />
    </div>
  );
}
export function ProjectGuide() {
  return (
    <section className={styles.projectGuide} aria-labelledby="project-guide-title">
      <span className={styles.eyebrow}>Смотрите на задачу, а не только на оборудование</span>
      <h2 id="project-guide-title">Как читать историю объекта</h2>
      <WorkJourney
        items={[
          {
            title: 'Исходные условия',
            text: 'Тип объекта, нужные зоны, существующие коммуникации и ограничения монтажа.',
          },
          { title: 'Принятое решение', text: 'Размещение оборудования, состав работ и способ подключения.' },
          {
            title: 'Результат',
            text: 'Что установлено и настроено. Фотографии и детали — в опубликованной карточке проекта.',
          },
        ]}
      />
    </section>
  );
}
