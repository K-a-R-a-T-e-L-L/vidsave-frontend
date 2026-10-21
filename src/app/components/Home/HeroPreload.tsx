// Async execution avoids stylesheet blocking; high-priority discovery avoids queuing
// this small bootstrap behind the application's JavaScript bundles.
export default function HeroPreload() {
  return (
    <>
      <link rel="preload" as="script" href="/scripts/hero-preload-v2.js" fetchPriority="high" />
      <script async src="/scripts/hero-preload-v2.js" />
    </>
  );
}
