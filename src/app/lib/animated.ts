export function animated() {
  const MediaQuery = window.matchMedia('(min-width: 769px)');
  const Desktop = MediaQuery.matches;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!Desktop) return;

        const TagName = entry.target.tagName.toLowerCase();

        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            if (TagName === 'p') {
              entry.target.classList.add('animated_p');
            } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(TagName)) {
              entry.target.classList.add('animated_h');
            } else if (TagName === 'img' && !entry.target.classList.contains('no_animated')) {
              entry.target.classList.add('animated_img');
            } else if (['li', 'a'].includes(TagName)) {
              entry.target.classList.add('animated_li');
            } else if (TagName === 'hr') {
              entry.target.classList.add('animated_hr');
            }
          });
        }
      });
    },
    { threshold: 0.3 },
  );

  if (Desktop) {
    const AnimatedElements = document.querySelectorAll<HTMLElement>(
      'p, h1, h2, h3, h4, h5, h6, img:not(.no_animated), li:not(.slick-dots li), a, hr',
    );

    AnimatedElements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      AnimatedElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }
}
