import { PricingColumns } from '@/app/components/LandingPrimitives';
import refresh from '../Refresh.module.scss';
import Link from 'next/link';
import ActionLink from '../ActionLink.client';
import { IconArrowUpRight, IconFocus2, IconRoute, IconDatabase, IconAdjustmentsHorizontal } from '@tabler/icons-react';
import type { CatalogService } from '@/app/lib/catalog-types';
import { catalogServicePrice } from '@/app/lib/catalog-format';
import styles from '../SurveillancePage.module.scss';

const factors = [
  { icon: IconFocus2, title: 'Зоны и детализация', text: 'Сколько точек нужно видеть и что важно различать в кадре.' },
  { icon: IconRoute, title: 'Трассы и монтаж', text: 'Расстояния, высота установки и способ прокладки кабеля.' },
  { icon: IconDatabase, title: 'Глубина архива', text: 'Качество записи, режим работы и объём накопителя.' },
  {
    icon: IconAdjustmentsHorizontal,
    title: 'Оборудование и доступ',
    text: 'Новая система или доработка существующей, локальный и удалённый просмотр.',
  },
];
export default function PricingSection({ services }: { services: CatalogService[] }) {
  return (
    <section id="pricing" className={styles.section} aria-labelledby="price-title">
      <div className={styles.splitHeading}>
        <div>
          <span className={styles.eyebrow}>03 / Понятный состав работ</span>
          <h2 id="price-title">
            Стоимость начинается
            <br />
            <em>с вашей задачи.</em>
          </h2>
        </div>
        <p>
          У двух объектов с одинаковым количеством камер может быть разный объём монтажа. Поэтому сначала уточняем
          условия.
        </p>
      </div>
      <PricingColumns className={`${styles.pricingGrid} ${refresh.pricing}`}>
        <dl className={`${styles.factors} ${refresh.factors}`}>
          {factors.map((item) => (
            <div key={item.title}>
              <dt>
                <item.icon size={25} stroke={1.5} aria-hidden="true" />
                {item.title}
              </dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
        <aside className={`${styles.estimate} ${refresh.estimate}`} aria-labelledby="estimate-title">
          <span className={styles.eyebrow}>Для первого расчёта</span>
          <h3 id="estimate-title">
            Расскажите об объекте.
            <br />С остальным поможем.
          </h3>
          <ul>
            <li>Город и тип объекта</li>
            <li>Какие зоны хотите видеть</li>
            <li>Есть ли камеры и кабельные линии</li>
          </ul>
          <p>План или фотографии помогут точнее обсудить решение. Если их нет, начнём с описания.</p>
          <ActionLink href="#request" rightSection={<IconArrowUpRight size={19} aria-hidden="true" />}>
            Обсудить стоимость
          </ActionLink>
          <small>Работы, оборудование и материалы согласуем до монтажа.</small>
        </aside>
      </PricingColumns>
      {services.length > 0 && (
        <div className={styles.servicePrices}>
          <h3>Отдельные монтажные работы</h3>
          <p>Цены отдельных работ не включают автоматически стоимость всей системы.</p>
          <ul>
            {services.map((service) => (
              <li key={service.id}>
                <Link data-catalog-row href={`/services/${service.slug}`}>
                  <span>{service.name}</span>
                  <strong>
                    {catalogServicePrice(service)}
                    <IconArrowUpRight size={18} aria-hidden="true" />
                  </strong>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
