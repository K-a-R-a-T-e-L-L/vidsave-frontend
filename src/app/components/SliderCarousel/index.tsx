import { useCallback, useEffect, useState } from 'react';
import style from './styles.module.scss';
import Image from 'next/image';

interface SliderCarouselProps {
  altList: string[];
}

const SliderCarousel: React.FC<SliderCarouselProps> = ({ altList }) => {
  const [isJS, setIsJS] = useState<boolean>(false);
  const [shiftX, setShiftX] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [timeTranslateX, setTimeTranslateX] = useState<number>(1);

  const shiftSlide = useCallback(
    (direction: string) => {
      setTimer(0);
      if (direction === 'right') {
        setShiftX((prevState) => {
          if (prevState > (altList.length - 1) * -100) {
            setTimeTranslateX((prevState) => (prevState === 3 ? 3 : 1));
            return prevState - 100;
          } else {
            setTimeTranslateX(0);
            return 0;
          }
        });
      } else {
        setShiftX((prevState) => {
          if (prevState === 0) {
            setTimeTranslateX(0);
            return (altList.length - 1) * -100;
          } else {
            setTimeTranslateX((prevState) => (prevState === 3 ? 3 : 1));
            return prevState + 100;
          }
        });
        // setShiftX((prevState) => prevState === 0 ? ((altList.length - 1) * -100) : (prevState + 100));
      }
    },
    [altList.length],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsJS(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (timer === 3) {
      const animationTimeout = setTimeout(() => {
        setTimeTranslateX(3);
        shiftSlide('right');
      }, 0);

      return () => clearTimeout(animationTimeout);
    }

    const timeout = setTimeout(() => {
      setTimer((prevState) => prevState + 1);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [timer, shiftSlide]);

  return (
    <div className={style.slider}>
      <div className={style.slider__box}>
        <button
          aria-label="Предыдущие примеры работ"
          className={style.box__button}
          onClick={() => {
            shiftSlide('left');
            setTimeTranslateX(1);
          }}
        ></button>
        <div className={style.box__window}>
          <div
            className={`${style.window__track} ${isJS ? '' : style.window__track_animation}`}
            style={
              {
                '--time-animation': `${altList.length * 3}s`,
                transform: `translateX(${shiftX}%)`,
                '--time-translate-x': `${timeTranslateX}s`,
              } as React.CSSProperties
            }
          >
            {altList.map((el, i) => {
              return (
                <div className={style.window__element} key={i}>
                  <Image
                    src={`/images/projects/project_${i + 1}.jpg`}
                    alt={el}
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    fill
                    placeholder={'blur'}
                    blurDataURL={`/images/projects/project_${i + 1}_blur.jpg`}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <button
          aria-label="Следующие примеры работ"
          className={style.box__button}
          onClick={() => {
            shiftSlide('right');
            setTimeTranslateX(1);
          }}
        ></button>
      </div>
    </div>
  );
};

export default SliderCarousel;
