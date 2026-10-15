(function () {
  if (location.pathname !== '/') return;
  var saved = 'light';
  try {
    saved = localStorage.getItem('vidsave_theme') || 'light';
  } catch (_) {}
  var dark = saved === 'dark' || (saved === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  var size = matchMedia('(max-width: 960px)').matches ? '960' : '1920';
  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.type = 'image/avif';
  link.fetchPriority = 'high';
  link.href = '/images/media-pack/hero-' + (dark ? 'dark' : 'light') + '-' + size + '.avif';
  document.head.appendChild(link);
})();
