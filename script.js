window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  const hero = document.getElementById('hero');
  const heroPin = document.getElementById('heroPin');
  const header = document.getElementById('siteHeader');
  const keywords = gsap.utils.toArray('.hl-word');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth > 768;

  const scaleCanvas = () => {
    if (!isDesktop()) {
      hero.style.transform = '';
      header.style.transform = '';
      return;
    }
    const scale = Math.min(1, window.innerWidth / 1728);
    hero.style.transform = `scale(${scale})`;
    header.style.transform = `scale(${scale})`;
  };
  scaleCanvas();
  window.addEventListener('resize', () => {
    scaleCanvas();
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  });

  if (reducedMotion) {
    header.classList.remove('is-blurred');
    gsap.fromTo('.headline', { opacity: 0 }, { opacity: 1, duration: 0.5 });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  if (isDesktop()) {
    const scale = Math.min(1, window.innerWidth / 1728);
    const settleY = Math.max(-400, Math.min(-20, window.innerHeight / (2 * scale) - 838));

    const pinTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroPin,
        start: 'top top',
        end: () => '+=' + window.innerHeight,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          header.classList.toggle('is-blurred', self.progress > 0.03);
        },
      },
    });

    pinTl
      .to('.headline', { yPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0)
      .to('.subhead', { yPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0)
      .to('.cta-row', { yPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0)
      .to('.glass-panel', { y: settleY, ease: 'power2.out', duration: 1 }, 0);
  }

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