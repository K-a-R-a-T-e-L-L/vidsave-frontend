import { IconSnowflake, IconSun, IconWind } from '@tabler/icons-react';
import styles from './TradePage.module.scss';
export default function ClimateBenefits() {
  return (
    <div className={styles.climateBadge}>
      <ul>
        <li>
          <IconSnowflake aria-hidden="true" />
          <span>
            Охлаждение
            <br />
            летом
          </span>
        </li>
        <li>
          <IconSun aria-hidden="true" />
          <span>
            Обогрев
            <br />в межсезонье
          </span>
        </li>
        <li>
          <IconWind aria-hidden="true" />
          <span>
            Фильтрация
            <br />
            воздуха
          </span>
        </li>
      </ul>
      <small>Обогрев и фильтрация — в зависимости от модели.</small>
    </div>
  );
}
