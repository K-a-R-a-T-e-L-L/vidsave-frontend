'use client';
import FaqSchema from '../FaqSchema';

import FeedbackSection from '../FeedbackSection';
import ContentCard from '../ContentCard';
import Contacts from '../Contacts';
import { Accordion, Button } from '@mantine/core';
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBolt,
  IconCamera,
  IconMapPin,
  IconPhone,
  IconSettings,
  IconShoppingCart,
  IconTool,
  IconPlayerPlayFilled,
  IconChevronRight,
  IconShieldCheck,
  IconSnowflake,
} from '@tabler/icons-react';
import { EditableImage as Image, PageText, useContactData, ManagedSection } from '@/app/components/CmsContent';
import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { catalogServicePrice } from '@/app/lib/catalog-format';
import type { ContentItem } from '@/app/lib/cms-types';
import type { CatalogService } from '@/app/lib/catalog-types';
import { companyData, contactData } from '@/app/lib/site';
import { directionCategorySlugs } from '@/app/lib/public-content';
import type { CatalogCategory } from '@/app/lib/catalog-types';
import styles from './styles.module.scss';
import intro from './intro.module.scss';
import { homeServiceMedia } from '@/app/lib/home-media';

const categories = [
  {
    title: 'Видеонаблюдение',
    text: 'Монтаж, настройка и обслуживание систем видеонаблюдения.',
    icon: <IconCamera size={24} />,
  },
  {
    title: 'Кондиционеры',
    text: 'Установка и обслуживание оборудования для климатических задач.',
    icon: <IconSnowflake size={24} />,
  },
  {
    title: 'Электромонтаж',
    text: 'Электромонтажные работы для дома и коммерческих объектов.',
    icon: <IconBolt size={24} />,
  },
];

const processSteps = [
  { number: '01', title: 'Обсуждаем задачу', text: 'Уточняем объект и то, какой результат вы хотите получить.' },
  { number: '02', title: 'Подбираем вариант', text: 'Согласуем состав работ и подходящее решение.' },
  { number: '03', title: 'Монтируем и настраиваем', text: 'Выполняем согласованные монтажные и настройочные работы.' },
  { number: '04', title: 'Остаёмся на связи', text: 'Можно обратиться по вопросам обслуживания и дальнейших работ.' },
];

const advantages = [
  {
    title: 'Решение под объект',
    text: 'Учитываем планировку, задачи и оборудование: вы получаете решение для своего объекта.',
    icon: <IconShieldCheck size={22} />,
  },
  {
    title: 'Монтаж и настройка',
    text: 'Установим оборудование, настроим запись и проверим работу системы.',
    icon: <IconSettings size={22} />,
  },
  {
    title: 'Несколько направлений',
    text: 'Видеонаблюдение, кондиционеры и электромонтажные работы.',
    icon: <IconBolt size={22} />,
  },
  {
    title: 'Общение напрямую',
    text: 'Обсудите задачу напрямую с компанией и получите ответы перед началом работ.',
    icon: <IconPhone size={22} />,
  },
];

const questions = [
  {
    question: 'От чего зависит стоимость работ?',
    answer:
      'Стоимость зависит от состава работ, объекта и выбранного оборудования. Цены на отдельные работы есть в каталоге. Расскажите об объекте — уточним состав работ и стоимость вашего решения.',
  },
  {
    question: 'С какими задачами можно обратиться?',
    answer: 'Компания оказывает услуги по монтажу видеонаблюдения, кондиционированию и электромонтажным работам.',
  },
  {
    question: 'Где вы работаете?',
    answer:
      'Компания работает в Кемерово и Кемеровской области. Возможность работ по конкретному адресу можно обсудить при обращении.',
  },
  {
    question: 'Как обсудить задачу?',
    answer: 'Позвоните по номеру ' + contactData.phoneLabel + ' или напишите на ' + companyData.email + '.',
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.eyebrow}>
        <PageText value={eyebrow} />
      </span>
      <h2>
        <PageText value={title} />
      </h2>
      {description && (
        <p>
          <PageText value={description} />
        </p>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className={intro.hero} id="home" aria-labelledby="hero-title">
      <div className={`${intro.heroPhoto} ${intro.heroLight}`} aria-hidden="true" />
      <div className={`${intro.heroPhoto} ${intro.heroDark}`} aria-hidden="true" />
      <div className={intro.heroInner}>
        <div className={intro.heroContent}>
          <h1 id="hero-title">
            Надёжное <br />
            видеонаблюдение <br />
            <em>для дома и бизнеса</em>
          </h1>
          <p className={intro.heroDescription}>
            Продажа оборудования, профессиональный монтаж
            <br className={intro.desktopBreak} /> и обслуживание систем безопасности в Кемерово и области.
          </p>
          <div className={intro.heroActions}>
            <Button component={Link} href="#request" rightSection={<IconArrowRight size={20} aria-hidden="true" />}>
              Оставить заявку
            </Button>
            <Button
              component={Link}
              href="/projects"
              variant="default"
              leftSection={<IconPlayerPlayFilled size={17} aria-hidden="true" />}
            >
              Смотреть проекты
            </Button>
          </div>
          <ul className={intro.heroHighlights} aria-label="Продажа, установка и обслуживание">
            <li>
              <span>
                <IconShoppingCart size={25} aria-hidden="true" />
              </span>
              <div>
                <strong>Продажа</strong>
                <small>
                  Современное
                  <br />
                  оборудование
                </small>
              </div>
            </li>
            <li>
              <span>
                <IconSettings size={25} aria-hidden="true" />
              </span>
              <div>
                <strong>Установка</strong>
                <small>
                  Профессиональный
                  <br />
                  монтаж
                </small>
              </div>
            </li>
            <li>
              <span>
                <IconTool size={25} aria-hidden="true" />
              </span>
              <div>
                <strong>Обслуживание</strong>
                <small>
                  Стабильная работа
                  <br />
                  вашей системы
                </small>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function QuickLinks({ catalogCategories }: { catalogCategories: CatalogCategory[] }) {
  return (
    <section className={intro.quickSection} id="solutions" aria-label="Наши услуги">
      <div className={`${intro.container} ${intro.quickGrid}`}>
        {homeServiceMedia.map((item, index) => (
          <Link
            className={intro.quickCard}
            href={
              catalogCategories.some((category) => category.slug === directionCategorySlugs[index])
                ? '/services?category=' + directionCategorySlugs[index]
                : '/services'
            }
            key={item.title}
          >
            <span
              className={intro.quickPhoto}
              aria-hidden="true"
              style={
                {
                  '--service-photo-light': `url("${item.lightSrc}")`,
                  '--service-photo-dark': `url("${item.src}")`,
                } as CSSProperties
              }
            />
            <span className={intro.quickShade} />
            <div className={intro.quickBody}>
              {index === 0 && <span className={intro.quickEyebrow}>Наши услуги</span>}
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className={intro.quickMore}>
                <span className={intro.quickArrow}>
                  <IconChevronRight size={21} aria-hidden="true" />
                </span>
                Подробнее
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Directions({ catalogCategories }: { catalogCategories: CatalogCategory[] }) {
  return (
    <ManagedSection
      title="Всё необходимое для вашего объекта"
      className={`${styles.section} ${styles.directions}`}
      id="directions"
    >
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Направления"
          title="Всё необходимое для вашего объекта"
          description="Три направления работ компании — для жилых и коммерческих объектов."
        />
        <div className={styles.directionGrid}>
          {categories.map((category, index) => (
            <Link
              href={
                catalogCategories.some((item) => item.slug === directionCategorySlugs[index])
                  ? '/services?category=' + directionCategorySlugs[index]
                  : '/services'
              }
              className={styles.directionCard}
              key={category.title}
            >
              <span className={styles.directionNumber}>0{index + 1}</span>
              <span className={styles.directionIcon}>{category.icon}</span>
              <strong>
                <PageText value={category.title} />
              </strong>
              <p>
                <PageText value={category.text} />
              </p>
              <span className={styles.directionLink}>
                <PageText value={'Смотреть услуги'}>{'Смотреть услуги'}</PageText>
                <IconArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </ManagedSection>
  );
}

function ServiceCard({ service }: { service: CatalogService }) {
  const category = service.category.name.toLocaleLowerCase('ru');
  const ServiceIcon = category.includes('кондиц') ? IconSnowflake : category.includes('элект') ? IconBolt : IconCamera;

  return (
    <article className={styles.serviceCard}>
      <Link
        className={styles.serviceImage}
        href={`/services/${service.slug}`}
        aria-label={`Подробнее: ${service.name}`}
      >
        {service.imagePath ? (
          <Image
            src={service.imagePath}
            quality={75}
            alt={service.imageAlt || service.name}
            fill
            sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 25vw"
          />
        ) : (
          <span className={styles.serviceImagePlaceholder}>
            <ServiceIcon size={38} aria-hidden="true" />
          </span>
        )}
      </Link>
      <div className={styles.serviceContent}>
        <span className={styles.serviceCategory}>{service.category.name}</span>
        <h3>
          <Link href={`/services/${service.slug}`}>{service.name}</Link>
        </h3>
        <p>{service.description}</p>
        <div className={styles.serviceBottom}>
          <strong>{catalogServicePrice(service)}</strong>
          <Link href={`/services/${service.slug}`} aria-label={`Подробнее об услуге «${service.name}»`}>
            <IconArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function PopularServices({ services }: { services: CatalogService[] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const availableCategories = useMemo(
    () => Array.from(new Map(services.map((service) => [service.category.slug, service.category])).values()),
    [services],
  );
  const filteredServices = useMemo(() => {
    const selected =
      activeCategory === 'all' ? services : services.filter((service) => service.category.slug === activeCategory);
    return selected.slice(0, 8);
  }, [activeCategory, services]);

  return (
    <ManagedSection title="Популярные услуги" className={`${styles.section} ${styles.servicesSection}`} id="services">
      <span id="priceList" className={styles.anchorMarker} />
      <div className={styles.container}>
        <div className={styles.servicesHeading}>
          <SectionHeading
            eyebrow="Каталог"
            title="Популярные услуги"
            description="Актуальные услуги и цены из каталога компании."
          />
          <Button component={Link} href="/services" variant="default" rightSection={<IconArrowUpRight size={17} />}>
            <PageText value={'Все услуги'}>{'Все услуги'}</PageText>
          </Button>
        </div>
        <div className={styles.filters} role="group" aria-label="Фильтр услуг по категории">
          <button
            type="button"
            className={activeCategory === 'all' ? styles.filterActive : styles.filter}
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
          >
            <PageText value={'Все услуги'}>{'Все услуги'}</PageText>
          </button>
          {availableCategories.map((category) => (
            <button
              type="button"
              className={activeCategory === category.slug ? styles.filterActive : styles.filter}
              onClick={() => setActiveCategory(category.slug)}
              aria-pressed={activeCategory === category.slug}
              key={category.id}
            >
              {category.name}
            </button>
          ))}
        </div>
        {filteredServices.length > 0 ? (
          <div className={styles.serviceGrid}>
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyServices}>
            <PageText value={'Опубликованных услуг пока нет.'}>{'Опубликованных услуг пока нет.'}</PageText>
          </p>
        )}
      </div>
    </ManagedSection>
  );
}

function WorkProcess() {
  return (
    <ManagedSection title="Как мы работаем" className={`${styles.section} ${styles.process}`} id="process">
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Этапы работы"
          title="Как мы работаем"
          description="Последовательность зависит от задачи и согласованного состава работ."
        />
        <ol className={styles.processGrid}>
          {processSteps.map((step) => (
            <li className={styles.processCard} key={step.number}>
              <span className={styles.processNumber}>{step.number}</span>
              <h3>
                <PageText value={step.title} />
              </h3>
              <p>
                <PageText value={step.text} />
              </p>
            </li>
          ))}
        </ol>
        <Link className={styles.textLink} href="/about">
          <PageText value={'Подробнее о подходе компании →'}>{'Подробнее о подходе компании →'}</PageText>
        </Link>
      </div>
    </ManagedSection>
  );
}

function Advantages() {
  return (
    <ManagedSection
      title="Безопасность начинается с подходящего решения"
      className={`${styles.section} ${styles.advantages}`}
      id="advantages"
    >
      <div className={styles.container}>
        <div className={styles.advantagesLayout} id="information">
          <div className={styles.advantagesCopy}>
            <span className={styles.eyebrow}>
              <PageText value={'О компании'}>{'О компании'}</PageText>
            </span>
            <h2>
              <PageText value={'Безопасность начинается с подходящего решения'}>
                {'Безопасность начинается с подходящего решения'}
              </PageText>
            </h2>
            <p>
              <PageText
                value={
                  'Состав работ подбирается с учётом объекта и вашей задачи. Основные направления — видеонаблюдение, кондиционеры и электромонтаж.'
                }
              >
                {
                  'Состав работ подбирается с учётом объекта и вашей задачи. Основные направления — видеонаблюдение, кондиционеры и электромонтаж.'
                }
              </PageText>
            </p>
            <Link className={styles.textLink} href="/about">
              <PageText value={'О компании'}>{'О компании'}</PageText>
              <IconArrowRight size={17} />
            </Link>
          </div>
          <div className={styles.advantageGrid}>
            {advantages.map((item) => (
              <article className={styles.advantageCard} key={item.title}>
                <span className={styles.advantageIcon}>{item.icon}</span>
                <h3>
                  <PageText value={item.title} />
                </h3>
                <p>
                  <PageText value={item.text} />
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </ManagedSection>
  );
}

function ContentPreview({ items, kind }: { items: ContentItem[]; kind: 'posts' | 'projects' }) {
  if (!items.length) return null;
  const title = kind === 'posts' ? 'Советы по выбору и монтажу' : 'Наши работы';
  const route = kind === 'posts' ? '/blog' : '/projects';
  return (
    <ManagedSection title={title} className={styles.section} id={kind === 'projects' ? 'projects' : 'articles'}>
      <div className={styles.container}>
        <SectionHeading eyebrow={kind === 'posts' ? 'Блог' : 'Наши работы'} title={title} />
        {items.length ? (
          <div className={styles.exampleGrid}>
            {items.map((item) => (
              <ContentCard key={item.id} item={item} kind={kind} />
            ))}
          </div>
        ) : null}
        <Link className={styles.textLink} href={route}>
          Все {kind === 'posts' ? 'публикации' : 'проекты'} →
        </Link>
      </div>
    </ManagedSection>
  );
}

function Geography() {
  const { settings } = useContactData();
  return (
    <section className={styles.region} id="geography">
      <div className={styles.regionInner}>
        <div className={styles.regionCopy}>
          <span className={styles.eyebrow}>Рядом с вашим объектом</span>
          <h2>Кемерово и область</h2>
          <p>
            Дом, магазин или рабочая площадка — начнём с вашей задачи. Уточним адрес, условия монтажа и возможность
            выезда.
          </p>
          <Link className={styles.textLink} href="#request">
            Обсудить работы по вашему адресу <IconArrowUpRight size={18} />
          </Link>
        </div>
        <div className={styles.regionDetails}>
          <span className={styles.regionPin}>
            <IconMapPin size={32} aria-hidden="true" />
          </span>
          <div>
            <small>География работ</small>
            <strong>{settings.geography}</strong>
            <p>{settings.address}</p>
            <Link href="/contacts">Контакты и схема проезда →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Questions() {
  const { companyData, contactData } = useContactData();
  const faq = questions.map((item) =>
    item.question === 'Как обсудить задачу?'
      ? {
          ...item,
          answer: 'Позвоните по номеру ' + contactData.phoneLabel + ' или напишите на ' + companyData.email + '.',
        }
      : item,
  );
  return (
    <ManagedSection title="Что важно знать перед обращением" className={`${styles.section} ${styles.faq}`} id="faq">
      <div className={styles.container}>
        <SectionHeading eyebrow="Вопросы и ответы" title="Что важно знать перед обращением" />
        <FaqSchema items={faq} />
        <Accordion
          classNames={{
            root: styles.accordion,
            item: styles.accordionItem,
            control: styles.accordionControl,
            panel: styles.accordionPanel,
          }}
        >
          {faq.map((item) => (
            <Accordion.Item value={item.question} key={item.question}>
              <Accordion.Control>
                <PageText value={item.question} />
              </Accordion.Control>
              <Accordion.Panel>
                <PageText value={item.answer} />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </ManagedSection>
  );
}

export default function Home({
  services,
  catalogCategories,
  posts,
  projects,
}: {
  services: CatalogService[];
  catalogCategories: CatalogCategory[];
  posts: ContentItem[];
  projects: ContentItem[];
}) {
  return (
    <>
      <Hero />
      <QuickLinks catalogCategories={catalogCategories} />
      <Directions catalogCategories={catalogCategories} />
      <PopularServices services={services} />
      <WorkProcess />
      <Advantages />
      <ContentPreview kind="projects" items={projects} />
      <ContentPreview kind="posts" items={posts} />
      <Geography />
      <Questions />
      <Contacts />
      <FeedbackSection />
    </>
  );
}
