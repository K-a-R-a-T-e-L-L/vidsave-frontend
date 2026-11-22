import Link from 'next/link';
import { cityPath, serviceCities, type CityDirection } from '@/app/lib/service-area';
import styles from './styles.module.scss';

export default function CityLinks({
  direction,
  label = 'Города выезда',
  className = styles.cities,
}: {
  direction?: CityDirection;
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      {serviceCities.map(({ slug, name }) => (
        <Link key={slug} prefetch={false} href={cityPath(slug) + (direction ? '#' + direction : '')}>
          {name}
        </Link>
      ))}
    </nav>
  );
}
