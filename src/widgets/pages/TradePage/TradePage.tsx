import TradeProcess from '@/app/components/TradeProcess';
import { HeroBackdrop, HeroControls, PricingColumns } from '@/app/components/LandingPrimitives';
import ClimateBenefits from './ClimateBenefits';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import FeedbackSection from '@/app/components/FeedbackSection';
import JsonLd from '@/app/components/JsonLd';
import { Breadcrumbs } from '@/app/components/PublicPage';
import { absoluteUrl } from '@/app/lib/site';
import { getPublishedServices } from '@/app/lib/catalog';
import { catalogServicePrice } from '@/app/lib/catalog-format';
import { directionCategorySlugs } from '@/app/lib/public-content';
import ActionLink from '../SurveillancePage/ActionLink.client';
import SystemDiagram from './SystemDiagram';
import { tradeContent, type TradeKind } from './trade.data';
import styles from './TradePage.module.scss';
import type { CSSProperties } from 'react';

export default async function TradePage({ kind }: { kind: TradeKind }) {
  const data = tradeContent[kind];
  const category = directionCategorySlugs[kind === 'climate' ? 1 : 2];
  const services = (await getPublishedServices()).filter((item) => item.category.slug === category);
  const photoStyle = {
    '--trade-photo-light': `url('/images/home-v2/${data.lightMedia}.webp')`,
    '--trade-photo-dark': `url('/images/home-v2/${data.media}.webp')`,
  } as CSSProperties;
  return (
    <div className={`public-site ${styles.page}`} style={photoStyle}>
      <Header />
      <main id="main-content" className={styles.container}>
        <div className={styles.crumbs}>
          <Breadcrumbs items={[{ label: data.label, href: data.path }]} />
        </div>
        <section className={styles.hero} aria-labelledby="trade-title">
          <HeroBackdrop />
          <div className={styles.copy}>
            <span className={styles.eyebrow}>Кемерово · выезд по Кузбассу</span>
            <h1 id="trade-title">
              {data.heading}
              <br />
              <em>{data.accent}</em>
            </h1>
            <p className={styles.lead}>{data.lead}</p>
            <p>{data.intro}</p>
            <HeroControls />
          </div>
          <div className={`${styles.photo} ${kind === 'climate' ? styles.climatePhoto : ''}`}>
            {kind === 'climate' ? (
              <ClimateBenefits />
            ) : (
              <div className={styles.caption}>
                <strong>{data.visualLabel}</strong>
                <span>{data.visualText}</span>
              </div>
            )}
          </div>
        </section>
        <nav className={styles.sectionNav} aria-label={`Разделы: ${data.label}`}>
          <a href="#system">Как устроено</a>
          <a href="#works">Виды работ</a>
          <a href="#cost">Стоимость</a>
          <a href="#questions">Вопросы</a>
        </nav>
        <section id="system" className={styles.section} aria-labelledby="system-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>01 / Продуманное решение</span>
              <h2 id="system-title">{data.diagramTitle}</h2>
            </div>
            <p>{data.diagramIntro}</p>
          </div>
          <SystemDiagram kind={kind} />
        </section>
        <section id="works" className={styles.section} aria-labelledby="works-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>02 / От задачи к результату</span>
              <h2 id="works-title">{data.worksTitle}</h2>
            </div>
            <p>
              {kind === 'climate'
                ? 'Установка, регулярное обслуживание или восстановление работы — начнём с того, что нужно сейчас.'
                : 'Одна точка или несколько помещений. Подберём состав работ для квартиры, дома, офиса или магазина.'}
            </p>
          </div>
          <div className={kind === 'climate' ? styles.maintenance : styles.workGrid}>
            {data.works.map(([title, text], i) => (
              <article key={title} className={styles.work}>
                <span className={styles.number}>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href="#request" aria-label={`Обсудить: ${title}`}>
                  Обсудить работу <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section id="cost" className={styles.section} aria-labelledby="cost-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>03 / Понятный расчёт</span>
              <h2 id="cost-title">{data.costTitle}</h2>
            </div>
            <p>Сначала уточним условия. Затем согласуем работы, оборудование и материалы.</p>
          </div>
          <PricingColumns className={styles.pricing}>
            <dl>
              {data.factors.map(([title, text], i) => (
                <div key={title}>
                  <dt>
                    <span>0{i + 1}</span>
                    {title}
                  </dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <aside className={styles.estimate}>
              <span className={styles.eyebrow}>Для первого разговора</span>
              <h3>
                Покажите объект.
                <br />
                Поможем с остальным.
              </h3>
              <ul>
                {data.preparation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>Если нет плана или фотографий, начнём с описания.</p>
              <ActionLink href="#request">Обсудить стоимость ↗</ActionLink>
            </aside>
          </PricingColumns>
          {services.length > 0 && (
            <div className={styles.catalog}>
              <h3>Отдельные работы из каталога</h3>
              <p>Стоимость позиции не равна стоимости всего объекта.</p>
              {services.map((item) => (
                <Link data-catalog-row key={item.id} href={`/services/${item.slug}`}>
                  <span>{item.name}</span>
                  <strong>{catalogServicePrice(item)} ↗</strong>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className={styles.section} aria-labelledby="steps-title">
          <span className={styles.eyebrow}>04 / Последовательность работ</span>
          <h2 id="steps-title">
            {kind === 'climate'
              ? 'От выбора кондиционера до комфортной температуры'
              : 'От плана проводки до проверки подключений'}
          </h2>
          <div className={styles.processLayout}>
            <TradeProcess kind={kind} />
            <ol className={styles.steps}>
              {data.steps.map(([title, text], i) => (
                <li key={title}>
                  <span>0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.geography}>
            <div>
              <strong>Кемерово и Кемеровская область</strong>
              <p>
                Укажите населённый пункт в заявке. Возможность, сроки и стоимость выезда согласуем по адресу и объёму
                работ.
              </p>
            </div>
            <Link href="/contacts">Контакты и адрес ↗</Link>
          </div>
        </section>
        <section id="questions" className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-title">
          <div>
            <span className={styles.eyebrow}>Перед началом работ</span>
            <h2 id="faq-title">
              Разберёмся
              <br />в деталях
            </h2>
            <p>Не нашли ответ на свой вопрос? Расскажите о задаче — обсудим подходящий вариант.</p>
            <Link className={styles.textLink} href="#request">
              Задать вопрос ↗
            </Link>
          </div>
          <div>
            {data.faq.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <FeedbackSection />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': absoluteUrl(data.path + '#service'),
            name: data.title,
            description: data.description,
            url: absoluteUrl(data.path),
            provider: { '@id': absoluteUrl('/#business') },
            areaServed: 'Кемерово и Кемеровская область — выезд по согласованию',
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: data.faq.map(([q, a]) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
