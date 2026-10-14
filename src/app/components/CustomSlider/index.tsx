import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './styles.scss';
import React, { useEffect } from 'react';
import Image from 'next/image';
import { SliderProps } from '@/app/types/SliderProps';

const CustomSlider: React.FC<SliderProps> = ({ props }) => {
  const StylesContainer = {
    ...props.styles.container,
    '--buttons': props.styles.buttons ? 'block' : 'none',
  };

  const StylesTitle = {
    ...props.styles.title,
    '--fontSizeMobile': props.styles.title.fontSizeMobile,
  };

  useEffect(() => {
    const Slides = document.querySelectorAll('.slick-slide');

    Slides.forEach((el) => {
      const ActiveSlide = el.classList.contains('slick-active') && el.getAttribute('area-hidden') === 'false';
      if (ActiveSlide) {
        el.removeAttribute('inert');
      } else {
        el.setAttribute('inert', 'true');
      }
    });
  }, []);

  return (
    <div className={'container_slider'} style={StylesContainer as React.CSSProperties}>
      <h2 style={StylesTitle as React.CSSProperties}>{props.title}</h2>
      <Slider {...props.settings}>
        {props.arrayURL.map((el, i) => {
          return (
            <div key={i} className={'item_slider'}>
              <Image
                src={el[0]}
                alt={el[1]}
                className={props.styles.class}
                style={{ objectFit: props.styles.imgSizes }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                fill
                placeholder={el.length === 3 ? 'blur' : 'empty'}
                blurDataURL={el.length === 3 ? el[2] : ''}
              />
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default CustomSlider;
