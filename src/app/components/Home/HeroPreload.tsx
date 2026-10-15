// Runs while parsing the home page, before CSS has discovered the LCP background.
// ColorSchemeScript has already restored the visitor's saved theme in the document head.
export default function HeroPreload() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){if(location.pathname!=='/')return;var theme=document.documentElement.getAttribute('data-mantine-color-scheme')==='dark'?'dark':'light';var size=matchMedia('(max-width: 960px)').matches?'960':'1920';var link=document.createElement('link');link.rel='preload';link.as='image';link.type='image/avif';link.fetchPriority='high';link.href='/images/media-pack/hero-'+theme+'-'+size+'.avif';document.head.appendChild(link);})();`,
      }}
    />
  );
}
