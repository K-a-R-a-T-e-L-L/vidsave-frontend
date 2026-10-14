'use client';
import Image from '@/app/components/MediaImage';
import style from './styles.module.scss';
import React, { useState } from 'react';
import Link from 'next/link';
import type { CatalogService } from '@/app/lib/catalog-types';
import { catalogServicePrice } from '@/app/lib/catalog-format';

type IformationCardType = {
  all: {
    icon: string;
    title: string;
    description: string;
    alt: string;
  }[];
  basic: {
    preview: string;
    title: string;
    description: string;
    alt: string;
  }[];
};

const PriceList: React.FC<{ services: CatalogService[] }> = ({ services }) => {
  const [InformationCard] = useState<IformationCardType>({
    all: services.map((service) => ({
      icon: service.imagePath ?? '/images/installing_cameras.jpg',
      title: service.name,
      description: service.description,
      alt: service.name,
    })),
    basic: [
      {
        preview: '/images/camera_left.png',
        title: 'Установка камер видеонаблюдения в режиме онлайн',
        description: 'Создаем индивидуальные решения для любого типа объекта.',
        alt: 'Установка камер видеонаблюдения в Кемерово',
      },
      {
        preview: '/images/pc_tel.png',
        title: 'Настройка оборудования и обучение пользованию',
        description:
          'Получите возможность удаленного доступа к камерам через смартфон или компьютер, просматривайте записи в любое время и будьте спокойны за своих близких и свое дело.',
        alt: 'Настройка удаленного доступа',
      },
      {
        preview: '/images/technical_support.png',
        title: 'Обслуживание и техническая поддержка',
        description:
          'Мы работаем в строгом соответствии с действующими нормами и правилами, используя только сертифицированные материалы и проверенные технологии.',
        alt: 'Обслуживание и тех. поддержка оборудования в Кузбассе',
      },
    ],
  });

  return (
    <section className={style.price_list} id="priceList">
      <article className={style.price_list__article_first}>
        <h2 className={`${style.article_first__title}`}>Наши популярные услуги</h2>
        <p className={`${style.article_first__description}`}>
          Мы предоставляем широкий спектр услуг в области монтажной деятельности
        </p>
        <div className={style.article_first__box_services}>
          {InformationCard.all.length > 0 ? (
            InformationCard.all.map((el, i) => {
              return (
                <div className={style.box_services__card} key={i}>
                  <Link href={`/services/${services[i]?.slug ?? ''}`} className={style.card__icon}>
                    <Image
                      src={el.icon}
                      alt={el.alt}
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      fill
                    />
                  </Link>
                  <h3 className={`${style.card__title}`}>{el.title}</h3>
                  <p className={`${style.card__description}`}>{el.description}</p>
                  {services[i] && <p>{catalogServicePrice(services[i])}</p>}
                </div>
              );
            })
          ) : (
            <></>
          )}
        </div>
        <Link href="/services" className={style.article_first__more}>
          Больше {'>'}
        </Link>
      </article>
      <article className={style.price_list__article_last}>
        <h2 className={`${style.article_last__title}`}>
          Наши ключевые услуги по видеонаблюдению в Кемерово и Кемеровской области
        </h2>
        <p className={`${style.article_last__description}`}>
          Мы предлагаем полный спектр услуг по проектированию и монтажу систем видеонаблюдения. Наша команда гарантирует
          надежность и высокое качество обслуживания.
        </p>
        <div className={style.article_last__box_services}>
          {InformationCard.basic.length > 0 ? (
            InformationCard.basic.map((el, i) => {
              return (
                <div className={style.box_services__card} key={i}>
                  <div className={style.card__preview}>
                    <Image
                      src={el.preview}
                      alt={el.alt}
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      fill
                    />
                  </div>
                  <h3 className={`${style.card__title}`}>{el.title}</h3>
                  <p className={`${style.card__description}`}>{el.description}</p>
                </div>
              );
            })
          ) : (
            <></>
          )}
        </div>
      </article>
    </section>
  );
};

export default PriceList;
