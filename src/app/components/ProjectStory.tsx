import Link from 'next/link';
import type { ContentItem } from '../lib/cms-types';
import styles from './editorial-detail.module.scss';

// Only local catalogue, article and project paths are supported in project text.
const localLink = /\[([^\]\n]+)\]\((\/(?:services|projects|blog)\/(?:[a-z0-9/-]|\([a-z0-9-]+\))+)\)/g;

function paragraphs(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph, index) => {
      const parts = [];
      let start = 0;
      for (const match of paragraph.matchAll(localLink)) {
        parts.push(
          paragraph.slice(start, match.index),
          <Link key={match.index} href={match[2]}>
            {match[1]}
          </Link>,
        );
        start = match.index + match[0].length;
      }
      return (
        <p key={index}>
          {parts}
          {paragraph.slice(start)}
        </p>
      );
    });
}

export function ProjectStory({ item }: { item: ContentItem }) {
  const sections = [
    { title: 'Задача', text: item.task },
    { title: 'Решение', text: item.solution },
    { title: 'Результат', text: item.result },
  ].filter((section) => section.text?.trim());
  return (
    <div className={styles.story}>
      <aside className={styles.summary}>
        {item.objectType && (
          <>
            <h2>Объект</h2>
            <p>{item.objectType}</p>
          </>
        )}
        {!!item.galleryIds?.length && <a href="#photos">Посмотреть фотографии ↓</a>}
        {!!item.services?.length && <a href="#project-services">Работы и цены ↓</a>}
      </aside>
      <div className={styles.narrative}>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {paragraphs(section.text!)}
          </section>
        ))}
      </div>
    </div>
  );
}
