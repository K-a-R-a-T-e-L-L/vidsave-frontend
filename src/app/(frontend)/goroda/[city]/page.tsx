import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBolt,
  IconCamera,
  IconShoppingBag,
  IconSnowflake,
  IconMapPin,
  IconTools,
} from '@tabler/icons-react';
import Artwork from '@/app/components/Artwork';
import { HeroBackdrop, HeroControls } from '@/app/components/LandingPrimitives';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import FeedbackSection from '@/app/components/FeedbackSection';
import JsonLd from '@/app/components/JsonLd';
import MediaImage from '@/app/components/MediaImage';
import { CityEnquiryLink, CityEnquiryProvider } from '@/app/components/CityEnquiry';
import { Breadcrumbs, ServicePreview } from '@/app/components/PublicPage';
import { getPublishedServices } from '@/app/lib/catalog';
import { getCmsBootstrap, siteMetadata } from '@/app/lib/cms';
import { absoluteUrl } from '@/app/lib/site';
import { cityPath, serviceCities } from '@/app/lib/service-area';
import styles from './styles.module.scss';

type Props = { params: Promise<{ city: string }> };
const directions = [
  { id: 'videonablyudenie', label: 'Видеонаблюдение', photo: 'surveillance-day-owner', icon: IconCamera },
  { id: 'kondicionery', label: 'Кондиционеры', photo: 'air-conditioning-day-owner', icon: IconSnowflake },
  { id: 'elektromontazh', label: 'Электромонтаж', photo: 'electrical-day-owner', icon: IconBolt },
] as const;
export const dynamicParams = false;
export function generateStaticParams() {
  return serviceCities.map(({ slug }) => ({ city: slug }));
}
function cityContent(slug: string) {
  const city = serviceCities.find((item) => item.slug === slug);
  if (!city) notFound();
  return {
    ...city,
    path: cityPath(slug),
    title: `Видеонаблюдение, кондиционеры и электромонтаж ${city.location}`,
    description: `Установка камер, продажа и монтаж кондиционеров, электромонтаж ${city.location}. Цены на работы и расчёт выезда по адресу объекта.`,
  };
}
export async function generateMetadata({ params }: Props) {
  const city = cityContent((await params).city);
  return siteMetadata(city.title, city.description, city.path);
}

export default async function CityPage({ params }: Props) {
  const city = cityContent((await params).city);
  const [services, { settings }] = await Promise.all([getPublishedServices(), getCmsBootstrap()]);
  const prices = (slugs: string[]) => slugs.flatMap((slug) => services.filter((item) => item.slug === slug));
  return (
    <CityEnquiryProvider key={city.slug} city={city.name}>
      <div className="public-site">
        <Header />
        <main id="main-content" className={styles.main}>
          <Breadcrumbs
            items={[
              { label: 'Города выезда', href: '/contacts#goroda' },
              { label: city.name, href: city.path },
            ]}
          />
          <header className={styles.hero}>
            <HeroBackdrop />
            <div className={styles.heroCopy}>
              <div className={styles.location}>
                <IconMapPin size={17} aria-hidden="true" />
                Выезд по Кузбассу
              </div>
              <h1>{city.title}</h1>
              <p>
                Работаем в домах, квартирах и на объектах бизнеса. Согласуем состав работ, сроки и стоимость выезда по
                вашему адресу.
              </p>
              <HeroControls
                primaryLabel="Запросить расчёт"
                secondaryLabel="Услуги и цены"
                secondaryHref="#directions"
              />
            </div>
            <div className={styles.photo}>
              <MediaImage
                src="/images/media-pack/page-contacts.webp"
                alt="Специалист обсуждает установку оборудования с хозяйкой дома"
                fill
                sizes="(max-width: 900px) 94vw, (max-width: 1400px) 45vw, 620px"
                priority
              />
            </div>
          </header>
          <nav id="directions" className={styles.nav} aria-label="Услуги в городе">
            {directions.map(({ id, label, photo, icon: Icon }) => (
              <a href={'#' + id} key={id}>
                <div className={styles.thumb}>
                  <MediaImage
                    src={'/images/home-v2/' + photo + '.webp'}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 88px, (max-width: 1400px) 30vw, 410px"
                  />
                </div>
                <span className={styles.navLabel}>
                  <Icon aria-hidden="true" />
                  {label}
                  <IconArrowDownRight aria-hidden="true" />
                </span>
              </a>
            ))}
          </nav>
          <section className={styles.section} id="videonablyudenie">
            <div className={styles.split}>
              <div className={styles.scene}>
                <Artwork src="/images/surveillance/home-v2" alt="Схема частного дома с камерами у входа и въезда" />
              </div>
              <div>
                <h2>Установка видеонаблюдения</h2>
                <p>
                  Подберём камеры для входа, двора или помещения и настроим запись. Для расчёта укажите, какие зоны
                  хотите видеть и есть ли на объекте кабель или регистратор.
                </p>
                <h3>Цены на монтаж и настройку</h3>
                <ServicePreview
                  compact
                  services={prices([
                    'ustanovka-ip-kamer',
                    'ustanovka-ahd-kamer',
                    'ustanovka-nvr-(ip)-videoregistratora',
                  ])}
                />
                <div className={styles.links}>
                  <CityEnquiryLink service="cameras" className={styles.action}>
                    Рассчитать установку камер
                  </CityEnquiryLink>
                  <Link href="/videonablyudenie">
                    Все работы по видеонаблюдению <IconArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <section className={styles.climate} id="kondicionery">
            <h2>Установка кондиционеров</h2>
            <div className={styles.climateGrid}>
              <div className={styles.climateScene}>
                <Artwork
                  src="/images/trade-scenes/climate"
                  alt="Внутренний и наружный блоки кондиционера и трасса между ними"
                />
              </div>
              <div className={styles.options}>
                <article>
                  <IconShoppingBag className={styles.optionIcon} aria-hidden="true" />
                  <h3>Купить кондиционер с установкой</h3>
                  <p>
                    Сообщите площадь помещения. Подберём оборудование, обсудим расположение блоков и подготовим расчёт с
                    отдельной стоимостью кондиционера и монтажа.
                  </p>
                  <CityEnquiryLink service="purchase" className={styles.action}>
                    Подобрать кондиционер
                  </CityEnquiryLink>
                </article>
                <article>
                  <IconTools className={styles.optionIcon} aria-hidden="true" />
                  <h3>Установить свой кондиционер</h3>
                  <p>
                    Если оборудование уже куплено, укажите модель и есть ли готовая трасса. По этим данным оценим монтаж
                    и необходимые материалы.
                  </p>
                  <CityEnquiryLink service="installation" className={styles.action}>
                    Рассчитать монтаж своего кондиционера
                  </CityEnquiryLink>
                </article>
              </div>
            </div>
            <div className={styles.climatePrices}>
              <div>
                <h3>Стоимость монтажных работ</h3>
                <p>Цены ниже относятся к работам. Стоимость оборудования при покупке согласуем отдельно.</p>
                <Link href="/kondicionery">
                  Все работы по кондиционерам <IconArrowUpRight size={16} />
                </Link>
              </div>
              <ServicePreview
                compact
                services={prices([
                  'montazh-kondicionera-pod-klyuch',
                  'montazh-kondicionera-na-gotovuyu-trassu',
                  'prokladka-trassy-pod-kondicioner',
                ])}
              />
            </div>
          </section>
          <section className={styles.section} id="elektromontazh">
            <div className={styles.split}>
              <div>
                <h2>Электромонтажные работы</h2>
                <p>
                  Монтируем проводку в домах и квартирах, прокладываем кабель и собираем щиты. Для сметы пригодятся план
                  помещений, количество розеток и перечень оборудования.
                </p>
                <h3>Расценки на электромонтаж</h3>
                <ServicePreview
                  compact
                  services={prices([
                    'elektromontazh-v-1-komnatnoj-kvartire-(chastnom-dome)',
                    'sborka-elektroboksa',
                    'prokladka-kabelya-v-gofre',
                  ])}
                />
                <div className={styles.links}>
                  <CityEnquiryLink service="electrical" className={styles.action}>
                    Запросить смету на электромонтаж
                  </CityEnquiryLink>
                  <Link href="/elektromontazh">
                    Все электромонтажные работы <IconArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
              <div className={styles.scene}>
                <Artwork
                  src="/images/trade-scenes/electrical"
                  alt="Электрощит и разводка кабелей в разрезе помещения"
                />
              </div>
            </div>
          </section>
          <section className={styles.visit}>
            <Artwork src="/images/surveillance/region" width={1200} height={800} />
            <div>
              <h2>Выезд по вашему адресу</h2>
              <p>
                В заявке укажите улицу, тип объекта и удобное время для связи. Обсудим детали и согласуем выезд{' '}
                {city.location}.
              </p>
              {city.slug === 'kemerovo' && (
                <p>
                  Наш адрес: {settings.address}. <Link href="/contacts">Посмотреть на карте</Link>
                </p>
              )}
            </div>
            <Link href="/projects">
              Посмотреть наши работы <IconArrowUpRight size={18} />
            </Link>
          </section>
          <FeedbackSection />
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'Service',
              '@id': absoluteUrl(city.path + '#service'),
              url: absoluteUrl(city.path),
              name: city.title,
              serviceType: ['Видеонаблюдение', 'Установка кондиционеров', 'Электромонтаж'],
              description: city.description,
              areaServed: {
                '@type': 'City',
                name: city.name,
                containedInPlace: { '@type': 'AdministrativeArea', name: 'Кемеровская область — Кузбасс' },
              },
              isRelatedTo: directions.map(({ id }) => ({
                '@type': 'Service',
                '@id': absoluteUrl('/' + id + '#service'),
              })),
              provider: { '@id': absoluteUrl('/#business') },
            }}
          />
        </main>
        <Footer />
      </div>
    </CityEnquiryProvider>
  );
}
