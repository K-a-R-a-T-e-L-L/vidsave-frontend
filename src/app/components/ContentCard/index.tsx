import Image from '@/app/components/MediaImage';
import Link from 'next/link';
import { IconArrowUpRight, IconBook2 } from '@tabler/icons-react';
import type { ContentItem } from '@/app/lib/cms-types';
import styles from './styles.module.scss';
export default function ContentCard({ item, kind }: { item: ContentItem; kind: 'posts' | 'projects' }) {
  const href = (kind === 'posts' ? '/blog/' : '/projects/') + item.slug;
  return (
    <article className={styles.card}>
      {item.coverUrl ? (
        <Link href={href} className={styles.image} aria-label={item.title}>
          <Image
            src={item.coverUrl}
            quality={75}
            alt={item.coverAlt || item.title}
            fill
            sizes="(max-width:700px) 90vw,33vw"
          />
        </Link>
      ) : (
        <div className={styles.editorial}>
          <IconBook2 size={25} aria-hidden="true" />
          <span>{kind === 'posts' ? 'Практический разбор' : 'Наши работы'}</span>
        </div>
      )}
      <div className={styles.body}>
        <h3>
          <Link href={href}>{item.title}</Link>
        </h3>
        <p>{item.excerpt}</p>
        <div className={styles.bottom}>
          {item.publishedAt && (
            <time dateTime={item.publishedAt}>
              {new Date(item.publishedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          )}
          <Link href={href} aria-label={'Подробнее: ' + item.title}>
            Читать <IconArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
