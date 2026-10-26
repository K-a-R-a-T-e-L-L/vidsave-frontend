import type { ReactNode } from 'react';
import {
  IconArrowUpRight,
  IconChevronRight,
  IconFocus2,
  IconPlayerPlay,
  IconSettings,
  IconShieldCheck,
} from '@tabler/icons-react';
import ActionLink from '@/widgets/pages/SurveillancePage/ActionLink.client';
import styles from './styles.module.scss';

export function HeroBackdrop() {
  return <div className={styles.backdrop} aria-hidden="true" />;
}
export function HeroControls({ secondaryHref = '#system' }: { secondaryHref?: string }) {
  return (
    <>
      <div className={styles.actions}>
        <ActionLink href="#request" rightSection={<IconArrowUpRight size={19} aria-hidden="true" />}>
          Обсудить мой объект
        </ActionLink>
        <ActionLink
          href={secondaryHref}
          variant="subtle"
          rightSection={<IconPlayerPlay size={18} aria-hidden="true" />}
        >
          Как всё устроено
        </ActionLink>
      </div>
      <ul className={styles.benefits}>
        <li>
          <IconFocus2 size={25} aria-hidden="true" />
          <span>
            Подбор
            <br />
            под задачу
          </span>
        </li>
        <li>
          <IconSettings size={25} aria-hidden="true" />
          <span>
            Монтаж
            <br />и настройка
          </span>
        </li>
        <li>
          <IconShieldCheck size={25} aria-hidden="true" />
          <span>Обслуживание</span>
        </li>
      </ul>
    </>
  );
}
export function SceneChoice({
  id,
  name,
  value,
  index,
  title,
  text,
}: {
  id: string;
  name: string;
  value: number;
  index: number;
  title: string;
  text: string;
}) {
  return (
    <label className={styles.choice}>
      <input id={id} name={name} value={value} type="radio" defaultChecked={index === 0} />
      <span className={styles.row}>
        <span className={styles.number}>0{index + 1}</span>
        <span>
          <strong>{title}</strong>
          <small>{text}</small>
        </span>
        <IconChevronRight size={17} aria-hidden="true" />
      </span>
    </label>
  );
}
export function PricingColumns({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.pricing} ${className}`}>{children}</div>;
}
