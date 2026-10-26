import Artwork from '@/app/components/Artwork';
import { SceneChoice } from '@/app/components/LandingPrimitives';
import styles from './TradePage.module.scss';
import { tradeContent, type TradeKind } from './trade.data';

const scenes = {
  climate: [
    {
      x: 365,
      y: 340,
      path: 'M385 198 L773 146 Q788 149 790 170 L796 277 Q793 296 776 300 L415 320 Q397 317 394 300 Z',
    },
    { x: 1050, y: 410, path: 'M790 245 L1000 245 Q1067 245 1067 310 L1067 575 Q1067 645 1125 645', line: true },
    { x: 1280, y: 830, path: 'M1128 499 L1380 487 L1382 740 L1135 782 Z' },
  ],
  electrical: [
    { x: 390, y: 480, path: 'M148 307 L352 318 L355 654 L144 654 Z' },
    {
      x: 760,
      y: 182,
      path: 'M227 316 L227 142 L698 161 L1200 216 L1321 223 L1337 485 M698 161 L521 279 L518 704 M698 161 L698 224',
      line: true,
    },
    {
      x: 1235,
      y: 620,
      path: 'M497 703H549V749H497Z M1313 484H1348V532H1313Z M1313 710H1353V760H1313Z M650 221Q704 200 755 221V241Q704 266 650 241Z',
    },
  ],
};
export default function SystemDiagram({ kind }: { kind: TradeKind }) {
  const data = tradeContent[kind];
  return (
    <div className={styles.explorer}>
      <fieldset className={styles.sceneChoices}>
        <legend>Выберите часть системы</legend>
        {data.nodes.map(([title, text], index) => (
          <SceneChoice
            key={title}
            id={`${kind}-zone-${index}`}
            name={`${kind}-system`}
            value={index + 1}
            index={index}
            title={title}
            text={text}
          />
        ))}
      </fieldset>
      <figure className={styles.sceneVisual}>
        <div className={styles.sceneCanvas}>
          <Artwork
            src={`/images/trade-scenes/${kind}`}
            width={1448}
            height={1086}
            alt={
              kind === 'climate'
                ? 'Разрез помещения с внутренним и наружным блоками кондиционера'
                : 'Комната с электрощитом, кабельными трассами, освещением и розетками'
            }
          />
          <svg viewBox="0 0 1448 1086" aria-hidden="true" className={styles.sceneOverlay}>
            {scenes[kind].map((zone, i) => (
              <g key={i} data-zone={i + 1}>
                <path d={zone.path} className={'line' in zone ? styles.trace : styles.region} />
              </g>
            ))}
          </svg>
          {scenes[kind].map((zone, i) => (
            <label
              key={i}
              htmlFor={`${kind}-zone-${i}`}
              data-zone={i + 1}
              className={styles.scenePin}
              style={{ left: `${(zone.x / 1448) * 100}%`, top: `${(zone.y / 1086) * 100}%` }}
              aria-label={data.nodes[i][0]}
            >
              0{i + 1}
            </label>
          ))}
        </div>
        <figcaption>
          {kind === 'climate'
            ? 'Расположение блоков и трассы подбираем под помещение.'
            : 'Расположение линий и точек подбираем под ваш объект.'}
        </figcaption>
      </figure>
    </div>
  );
}
