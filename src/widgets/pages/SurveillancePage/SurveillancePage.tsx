import refresh from './Refresh.module.scss';
import { Container } from '@mantine/core';
import '@mantine/core/styles/Container.css';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import FeedbackSection from '@/app/components/FeedbackSection';
import { Breadcrumbs } from '@/app/components/PublicPage';
import JsonLd from '@/app/components/JsonLd';
import { getPublishedServices } from '@/app/lib/catalog';
import { absoluteUrl } from '@/app/lib/site';
import { selectSurveillanceServices, surveillanceContent, surveillanceFaq } from './surveillance.data';
import HeroSection from './sections/HeroSection';
import SolutionSection from './sections/SolutionSection';
import PricingSection from './sections/PricingSection';
import DeliverySection from './sections/DeliverySection';
import styles from './SurveillancePage.module.scss';
import Link from 'next/link';

export default async function SurveillancePage() {
  const services = selectSurveillanceServices(await getPublishedServices());
  return (
    <div className={`public-site ${styles.page} ${refresh.page}`}>
      <Header />
      <main id="main-content">
        <Container size={1480} className={styles.container}>
          <div className={styles.crumbs}>
            <Breadcrumbs items={[{ label: 'Видеонаблюдение', href: surveillanceContent.path }]} />
          </div>
          <HeroSection />
          <nav className={`${styles.sectionNav} ${refresh.nav}`} aria-label="Разделы видеонаблюдения">
            <a href="#zones">Задачи объекта</a>
            <a href="#system">Как работает система</a>
            <a href="#pricing">Стоимость</a>
            <a href="#maintenance">Обслуживание</a>
          </nav>
          <div className={styles.bodyContent}>
            <SolutionSection />
            <PricingSection services={services} />
            <DeliverySection />
            <section className={styles.faq} aria-labelledby="faq-title">
              <div>
                <span className={styles.eyebrow}>Перед установкой</span>
                <h2 id="faq-title">
                  Разберёмся
                  <br />в деталях
                </h2>
                <p>Ответы на вопросы о записи, подключении и выезде.</p>
                <div className={refresh.faqHelp}>
                  <strong>Не нашли свой вопрос?</strong>
                  <p>
                    Расскажите, какой у вас объект и что хотите видеть на камерах. Если система уже установлена —
                    укажите, что перестало работать.
                  </p>
                  <Link className={styles.textLink} href="#request">
                    Задать вопрос <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
              <div className={`${styles.questions} ${refresh.questions}`}>
                {surveillanceFaq.map((item) => (
                  <details key={item.question}>
                    <summary>
                      {item.question}
                      <span aria-hidden="true">+</span>
                    </summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
            <FeedbackSection />
          </div>
        </Container>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': absoluteUrl('/videonablyudenie#service'),
            name: surveillanceContent.title,
            description: surveillanceContent.description,
            url: absoluteUrl(surveillanceContent.path),
            provider: { '@id': absoluteUrl('/#business') },
            areaServed: 'Кемерово и Кемеровская область — выезд по согласованию',
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: surveillanceFaq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
