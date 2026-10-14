'use client';

import Script from 'next/script';
import { useCms } from '../CmsContent';

export function YMCounter() {
  const { settings } = useCms();
  const id = settings.analyticsId;
  if (!/^\d{1,12}$/.test(id)) return null;
  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${id}", "ym");

            ym(${id}, "init", {
              ssr: true,
              webvisor: false,
              clickmap: true,
              ecommerce: "dataLayer",
              accurateTrackBounce: true,
              trackLinks: true
            });
          `,
        }}
      />
      <noscript>
        <div>
          {/* Native img keeps the external Yandex Metrica tracking pixel available without JavaScript. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://mc.yandex.ru/watch/${id}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
        </div>
      </noscript>
    </>
  );
}
