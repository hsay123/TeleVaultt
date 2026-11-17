/**
 * TeleVault — site behaviour.
 * One ES module. Every initialiser feature-detects its DOM and fails silently.
 */

const CONFIG = {
  // The desktop app repository (the product).
  APP_REPO: 'hsay123/TGDrive',
  APP_URL: 'https://github.com/hsay123/TGDrive',
  // This website and its contributor documentation.
  WEB_REPO: 'hsay123/TeleVaultt',
  WEB_URL: 'https://github.com/hsay123/TeleVaultt',
  // TGDrive has no published release yet, so downloads point at the app repository.
  DOWNLOAD_URL: 'https://github.com/hsay123/TGDrive',
};

const CACHE_KEY = 'televault:github:v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = {
  lenis: null,
  headerOffset: 80,
  activeSection: null,
};

/* -------------------------------------------------------------------------- */
/* Smooth scrolling                                                           */
/* -------------------------------------------------------------------------- */

function initLenis() {
  if (prefersReducedMotion() || typeof window.Lenis !== 'function') return;

  const lenis = new window.Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
  });

  state.lenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  const header = $('#siteHeader');
  const updateOffset = () => {
    state.headerOffset = header ? Math.round(header.getBoundingClientRect().height) + 12 : 80;
  };
  updateOffset();
  window.addEventListener('resize', updateOffset);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    event.preventDefault();
    closeMenu();
    lenis.scrollTo(target, { offset: -state.headerOffset, duration: 1.1 });
    if (history.pushState) history.pushState(null, '', hash);
  });
}

/* -------------------------------------------------------------------------- */
/* Reveals                                                                    */
/* -------------------------------------------------------------------------- */

function initReveals() {
  const groups = $$('[data-reveal-stagger]');
  groups.forEach((group) => {
    $$('[data-reveal]', group).forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 70, 350)}ms`;
    });
  });

  const items = $$('[data-reveal]');
  if (!items.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -15% 0px', threshold: 0.01 },
  );

  items.forEach((item) => observer.observe(item));
}

/* -------------------------------------------------------------------------- */
/* Header glass + scrollspy                                                   */
/* -------------------------------------------------------------------------- */

function initHeader() {
  const header = $('#siteHeader');
  const heroPin = $('#heroPin');
  if (!header || !heroPin) return;

  let threshold = 0;
  const measure = () => {
    threshold = Math.max(0, heroPin.offsetHeight - window.innerHeight - 24);
  };
  measure();
  window.addEventListener('resize', measure);

  const update = () => {
    header.classList.toggle('is-blurred', window.scrollY > threshold);
  };

  update();
  if (state.lenis) state.lenis.on('scroll', update);
  else window.addEventListener('scroll', update, { passive: true });
}

function initScrollSpy() {
  const nav = $('.header__nav');
  if (!nav) return;

  const pill = $('.nav__pill', nav);
  const links = $$('.nav__link', nav);
  if (!links.length) return;

  const sections = links
    .map((link) => {
      const id = link.getAttribute('href');
      const section = id ? document.querySelector(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  let current = null;

  const setActive = (entry) => {
    if (current === entry) return;
    current = entry;

    links.forEach((link) => {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });
    if (!entry) {
      pill?.classList.remove('is-visible');
      return;
    }

    entry.link.classList.add('is-active');
    entry.link.setAttribute('aria-current', 'true');

    if (pill) {
      pill.style.left = `${entry.link.offsetLeft}px`;
      pill.style.width = `${entry.link.offsetWidth}px`;
      pill.classList.add('is-visible');
    }
  };

  const update = () => {
    if (window.scrollY < state.headerOffset) {
      setActive(null);
      return;
    }

    const line = state.headerOffset + 40;
    let active = null;

    sections.forEach((entry) => {
      const rect = entry.section.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > line) active = entry;
    });

    if (!active) {
      const last = sections[sections.length - 1];
      if (last.section.getBoundingClientRect().bottom <= line) active = last;
    }

    setActive(active);
  };

  update();
  if (state.lenis) state.lenis.on('scroll', update);
  else window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* -------------------------------------------------------------------------- */
/* Mobile menu                                                                */
/* -------------------------------------------------------------------------- */

function openMenu() {
  const sheet = $('#menuSheet');
  const toggle = $('#menuToggle');
  if (!sheet || !toggle) return;

  sheet.hidden = false;
  document.body.classList.add('menu-open');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Close menu');

  requestAnimationFrame(() => sheet.classList.add('is-open'));

  const focusable = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', sheet);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const trap = (event) => {
    if (event.key !== 'Tab') return;
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onKey = (event) => {
    if (event.key === 'Escape') closeMenu();
  };

  sheet._trap = trap;
  sheet._onKey = onKey;
  document.addEventListener('keydown', trap);
  document.addEventListener('keydown', onKey);

  first?.focus();
}

function closeMenu() {
  const sheet = $('#menuSheet');
  const toggle = $('#menuToggle');
  if (!sheet || sheet.hidden) return;

  sheet.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Open menu');

  if (sheet._trap) document.removeEventListener('keydown', sheet._trap);
  if (sheet._onKey) document.removeEventListener('keydown', sheet._onKey);

  const onEnd = () => {
    sheet.hidden = true;
    sheet.removeEventListener('transitionend', onEnd);
  };
  sheet.addEventListener('transitionend', onEnd);
  setTimeout(() => {
    if (!sheet.classList.contains('is-open')) sheet.hidden = true;
  }, 260);

  toggle?.focus();
}

function initMobileMenu() {
  const toggle = $('#menuToggle');
  const close = $('#menuClose');
  const sheet = $('#menuSheet');
  if (!toggle || !sheet) return;

  toggle.addEventListener('click', () => {
    if (sheet.hidden) openMenu();
    else closeMenu();
  });

  close?.addEventListener('click', closeMenu);

  $$('a[href^="#"]', sheet).forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

/* -------------------------------------------------------------------------- */
/* Accordion                                                                  */
/* -------------------------------------------------------------------------- */

function initAccordion() {
  const root = $('[data-accordion]');
  if (!root) return;

  const triggers = $$('.accordion__trigger', root);

  triggers.forEach((trigger) => {
    const item = trigger.closest('.accordion__item');
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      item?.classList.toggle('is-open', !expanded);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* GitHub data                                                                */
/* -------------------------------------------------------------------------- */

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* storage disabled — ignore */
  }
}

function formatCount(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function setStat(name, value, { animate = false } = {}) {
  const nodes = $$(`[data-stat="${name}"]`);
  const formatted = formatCount(value);
  if (formatted === null) return;

  nodes.forEach((node) => {
    node.classList.add('is-loaded');
    node.removeAttribute('data-skeleton');

    if (!animate || prefersReducedMotion() || value < 10) {
      node.textContent = formatted;
      return;
    }

    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = formatCount(Math.round(value * eased)) ?? formatted;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function showStarsTrust(stars) {
  const item = $('.trust__item--stars');
  if (!item) return;
  if (typeof stars === 'number' && stars >= 10) {
    item.hidden = false;
    setStat('stars', stars, { animate: true });
  } else {
    item.hidden = true;
  }
}

function renderIssues(issues) {
  const list = $('[data-issues-list]');
  const empty = $('[data-issues-empty]');
  if (!list || !empty) return;

  const items = Array.isArray(issues)
    ? issues.filter((issue) => issue && !issue.pull_request).slice(0, 5)
    : [];

  list.innerHTML = '';
  list.setAttribute('aria-busy', 'false');

  if (!items.length) {
    list.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.hidden = false;

  items.forEach((issue) => {
    const li = document.createElement('li');
    li.className = 'issues__item';

    const a = document.createElement('a');
    a.href = issue.html_url;
    a.target = '_blank';
    a.rel = 'noopener';

    const num = document.createElement('span');
    num.className = 'issues__num';
    num.textContent = `#${issue.number}`;

    const title = document.createElement('span');
    title.textContent = issue.title;

    a.append(num, title);
    li.append(a);
    list.append(li);
  });
}

function renderAvatars(contributors) {
  const track = $('[data-avatars]');
  const empty = $('[data-avatars-empty]');
  if (!track || !empty) return;

  const people = Array.isArray(contributors)
    ? contributors.filter((person) => person && person.login).slice(0, 12)
    : [];

  track.innerHTML = '';
  track.setAttribute('aria-busy', 'false');

  if (!people.length) {
    track.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  track.hidden = false;

  const makeAvatar = (person) => {
    const link = document.createElement('a');
    link.className = 'avatar';
    link.href = person.html_url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = person.login;

    const img = document.createElement('img');
    img.src = person.avatar_url;
    img.alt = '';
    img.width = 56;
    img.height = 56;
    img.loading = 'lazy';
    img.decoding = 'async';

    const name = document.createElement('span');
    name.textContent = person.login;

    link.append(img, name);
    return link;
  };

  people.forEach((person) => track.append(makeAvatar(person)));

  // Duplicate the row so the marquee loops without a jump.
  if (people.length > 2) {
    people.forEach((person) => {
      const clone = makeAvatar(person);
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      track.append(clone);
    });
  } else {
    track.classList.add('is-static');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  return response.json();
}

function hideRepoStats() {
  const stats = $('.repo__stats');
  if (stats) stats.hidden = true;
}

async function initGithubStats() {
  const panel = $('[data-github-panel]');
  const hasTargets = panel || $('[data-github-stars]') || $('[data-issues-list]');
  if (!hasTargets) return;

  const cached = readCache();
  if (cached) {
    if (cached.repo) {
      setStat('stars', cached.repo.stargazers_count);
      setStat('forks', cached.repo.forks_count);
      setStat('issues', cached.repo.open_issues_count);
      showStarsTrust(cached.repo.stargazers_count);
    }
    if (cached.contributors) {
      setStat('contributors', cached.contributors.length);
      renderAvatars(cached.contributors);
    }
    if (cached.issues) renderIssues(cached.issues);
    return;
  }

  const load = async () => {
    // If the API never answers, drop the skeletons instead of shimmering forever.
    setTimeout(() => {
      if ($('.repo__stats [data-skeleton]')) hideRepoStats();
    }, 10000);

    const base = `https://api.github.com/repos/${CONFIG.APP_REPO}`;

    const [repo, contributors, issues] = await Promise.allSettled([
      fetchJson(base),
      fetchJson(`${base}/contributors?per_page=12`),
      fetchJson(`${base}/issues?labels=good%20first%20issue&state=open&per_page=5`),
    ]);

    const data = {};

    if (repo.status === 'fulfilled') {
      data.repo = repo.value;
      setStat('stars', repo.value.stargazers_count);
      setStat('forks', repo.value.forks_count);
      setStat('issues', repo.value.open_issues_count);
      showStarsTrust(repo.value.stargazers_count);
    } else {
      showStarsTrust(0);
      hideRepoStats();
    }

    if (contributors.status === 'fulfilled') {
      data.contributors = contributors.value;
      setStat('contributors', Array.isArray(contributors.value) ? contributors.value.length : 0);
      renderAvatars(contributors.value);
    } else {
      renderAvatars([]);
    }

    if (issues.status === 'fulfilled') {
      data.issues = issues.value;
      renderIssues(issues.value);
    } else {
      renderIssues([]);
    }

    if (Object.keys(data).length) writeCache(data);
  };

  // Three third-party requests are not worth blocking the first paint for.
  // Start them once the contribute panel is about to be seen.
  if (panel && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(panel);
    return;
  }

  load();
}

/* -------------------------------------------------------------------------- */
/* Copy buttons + terminal typing                                             */
/* -------------------------------------------------------------------------- */

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  return ok;
}

function initCopyButtons() {
  const buttons = $$('[data-copy-target], [data-copy]');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const label = $('span', button);
    const original = label ? label.textContent : '';

    button.addEventListener('click', async () => {
      let text = button.getAttribute('data-copy');

      if (!text) {
        const id = button.getAttribute('data-copy-target');
        const source = id ? document.getElementById(id) : null;
        text = source ? source.textContent : '';
      }

      if (!text) return;

      try {
        const ok = await copyText(text);
        if (!ok) return;
        button.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        setTimeout(() => {
          button.classList.remove('is-copied');
          if (label) label.textContent = original;
        }, 2000);
      } catch {
        /* clipboard unavailable — leave the label alone */
      }
    });
  });
}

function initTerminalTyping() {
  const code = $('[data-typing]');
  if (!code) return;

  const full = code.textContent ?? '';
  if (!full) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const terminal = code.closest('[data-terminal]') ?? code;
  let started = false;

  code.textContent = '';

  const type = () => {
    let index = 0;
    const step = () => {
      index += Math.max(1, Math.round(full.length / 220));
      code.textContent = full.slice(0, index);
      if (index < full.length) {
        setTimeout(step, 12);
      } else {
        code.textContent = full;
      }
    };
    step();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        type();
        observer.disconnect();
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(terminal);
}

/* -------------------------------------------------------------------------- */
/* Scrub 1 — problem sorts into the grid                                      */
/* -------------------------------------------------------------------------- */

function initProblemSort() {
  const root = $('[data-sort]');
  if (!root) return;

  const rows = $$('[data-sort-row]', root);
  const cards = $$('[data-sort-card]', root);

  if (prefersReducedMotion() || !window.gsap || !window.ScrollTrigger) {
    return;
  }

  const { gsap } = window;
  const { ScrollTrigger } = window;

  gsap.set(cards, { opacity: 0, y: 14 });
  gsap.set(rows, { opacity: 1 });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top 78%',
        end: 'bottom 58%',
        scrub: 0.6,
      },
    })
    .to(rows, { opacity: 0.18, y: -6, stagger: 0.06, duration: 1 }, 0)
    .to(cards, { opacity: 1, y: 0, stagger: 0.07, duration: 1 }, 0.25);

  ScrollTrigger.refresh();
}

/* -------------------------------------------------------------------------- */
/* Scrub 2 — how it works                                                     */
/* -------------------------------------------------------------------------- */

function initHowItWorks() {
  const root = $('[data-how]');
  if (!root) return;

  const steps = $$('[data-how-step]', root);
  const frames = $$('[data-how-frame]', root);
  const list = $('.how__steps', root);
  if (!steps.length || !frames.length) return;

  const activate = (index) => {
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    frames.forEach((frame, i) => frame.classList.toggle('is-active', i === index));
  };

  if (prefersReducedMotion() || !window.ScrollTrigger || !list) {
    activate(0);
    return;
  }

  const { ScrollTrigger } = window;

  ScrollTrigger.create({
    trigger: list,
    start: 'top 62%',
    end: 'bottom 62%',
    onUpdate: (self) => {
      const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
      list.style.setProperty('--how-progress', String(self.progress));
      activate(index);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Tilt + spotlight                                                           */
/* -------------------------------------------------------------------------- */

function initTilt() {
  const cards = $$('[data-tilt]');
  if (!cards.length) return;
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const maxTilt = 3;

  cards.forEach((card) => {
    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;

      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * maxTilt}deg) rotateY(${
        (px - 0.5) * maxTilt
      }deg)`;
    };

    const reset = () => {
      card.style.transform = '';
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', reset);
  });
}

/* -------------------------------------------------------------------------- */
/* Hero (frozen layout — behaviour preserved)                                 */
/* -------------------------------------------------------------------------- */

function initHero() {
  const hero = document.getElementById('hero');
  const heroPin = document.getElementById('heroPin');
  const header = document.getElementById('siteHeader');
  if (!hero || !heroPin || !header) return;

  const reduced = prefersReducedMotion();
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
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });

  if (!window.gsap) return;
  const { gsap } = window;

  if (reduced) {
    header.classList.remove('is-blurred');
    gsap.fromTo('.headline', { opacity: 0 }, { opacity: 1, duration: 0.5 });
    return;
  }

  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  if (isDesktop() && window.ScrollTrigger) {
    const scale = Math.min(1, window.innerWidth / 1728);
    const settleY = Math.max(-400, Math.min(-20, window.innerHeight / (2 * scale) - 838));

    const pinTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroPin,
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
      },
    });

    pinTl
      .to('.headline', { yPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0)
      .to('.subhead', { yPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0)
      .to('.cta-row', { yPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0)
      .to('.glass-panel', { y: settleY, ease: 'power2.out', duration: 1 }, 0);
  }

  const keywords = gsap.utils.toArray('.hl-word');
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
}

function initVaultVideo() {
  const vaultCard = $('.glass-panel');
  const vaultVideo = $('.vault-video');
  if (!vaultCard || !vaultVideo) return;

  const reduced = prefersReducedMotion();
  let inView = false;
  let ready = false;
  let armed = false;

  const markReady = () => {
    if (reduced || ready) return;
    ready = true;
    vaultVideo.classList.add('is-ready');
  };

  const tryPlay = () => {
    if (reduced || !armed) return;
    vaultVideo.muted = true;
    const playPromise = vaultVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        vaultVideo.classList.remove('is-ready');
        ready = false;
      });
    }
  };

  vaultVideo.muted = true;

  if (reduced) {
    vaultVideo.autoplay = false;
    vaultVideo.removeAttribute('autoplay');
    vaultVideo.pause();
    return;
  }

  vaultVideo.addEventListener('canplay', markReady);
  if (vaultVideo.readyState >= 2) markReady();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (entry.isIntersecting) tryPlay();
          else vaultVideo.pause();
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(vaultCard);
  } else {
    inView = true;
  }

  // The showcase clip is over a megabyte. Let the poster, the fonts and the
  // first paint land before the media download starts competing for bandwidth.
  const arm = () => {
    armed = true;
    if (inView) tryPlay();
  };

  if (document.readyState === 'complete') {
    setTimeout(arm, 250);
  } else {
    window.addEventListener('load', () => setTimeout(arm, 250), { once: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) vaultVideo.pause();
    else if (inView) tryPlay();
  });
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

function initDownloadLinks() {
  $$('[data-download]').forEach((link) => {
    link.setAttribute('href', CONFIG.DOWNLOAD_URL);
  });
}

function initDocsToc() {
  const toc = $('.docs__toc');
  if (!toc) return;

  const links = $$('a[href^="#"]', toc);
  const sections = links
    .map((link) => {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const match = sections.find((item) => item.target === entry.target);
        if (!match) return;
        if (entry.isIntersecting) {
          links.forEach((link) => {
            link.classList.remove('is-active');
            link.removeAttribute('aria-current');
          });
          match.link.classList.add('is-active');
          match.link.setAttribute('aria-current', 'true');
        }
      });
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
  );

  sections.forEach((item) => observer.observe(item.target));
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                       */
/* -------------------------------------------------------------------------- */

function boot() {
  if (window.lucide) window.lucide.createIcons();

  initHero();
  initVaultVideo();
  initDownloadLinks();
  initLenis();
  initReveals();
  initHeader();
  initScrollSpy();
  initMobileMenu();
  initAccordion();
  initGithubStats();
  initCopyButtons();
  initTerminalTyping();
  initProblemSort();
  initHowItWorks();
  initTilt();
  initDocsToc();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
