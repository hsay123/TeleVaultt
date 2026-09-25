window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const hero = document.getElementById('hero');
  const header = document.getElementById('siteHeader');
  const keywords = gsap.utils.toArray('.hl-word');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scaleHero = () => {
    if (window.innerWidth <= 768) {
      hero.style.transform = '';
      hero.style.width = '';
      return;
    }
    const scale = Math.min(1, window.innerWidth / 1728);
    hero.style.transform = `scale(${scale})`;
    hero.style.width = `${1728 * scale}px`;
  };
  scaleHero();
  window.addEventListener('resize', scaleHero);

  if (reducedMotion) {
    header.classList.remove('is-blurred');
    gsap.fromTo('.headline', { opacity: 0 }, { opacity: 1, duration: 0.5 });
    return;
  }

  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onToggle: (self) => {
      header.classList.toggle('is-blurred', self.isActive);
    },
  });

  gsap.fromTo(
    keywords,
    { autoAlpha: 0, y: 12, filter: 'blur(8px)' },
    {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.04,
      delay: 0.1,
    },
  );
});