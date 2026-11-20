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
  // CTAs always land on the dedicated download page, never on the repo root.
  DOWNLOAD_URL: 'download.html',
};

/* -------------------------------------------------------------------------- */
/* Release state — edited by scripts/set-release.mjs                          */
/* -------------------------------------------------------------------------- */

// "" = no published installer yet (or a stable release when BETA is false).
const RELEASE_TAG = '';
const BETA = true;
const APP_VERSION = '0.1.0'; // televault/package.json

const CACHE_KEY = 'televault:github:v1';
const RELEASE_CACHE_KEY = 'televault:release:v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const RELEASE_ASSETS = {
  windows: 'TeleVault-windows-x64.exe',
  'mac-arm64': 'TeleVault-macos-arm64.dmg',
  'mac-x64': 'TeleVault-macos-x64.dmg',
  linux: 'TeleVault-linux-x64.AppImage',
};

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

  /*
   * The chrome only gains its glass fill once the hero has actually scrolled
   * past the bar, so the sky stays visible behind a transparent header.
   * Comparing the two edges rather than a scroll offset keeps that true in
   * both layouts: the desktop hero is pinned, so its background stays behind
   * the bar long after the page starts moving, and the mobile sky is fixed to
   * the viewport. A scroll threshold fired the glass early in both cases and
   * painted a white rectangle over the photo.
   */
  const update = () => {
    const pastHero = heroPin.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom;
    header.classList.toggle('is-blurred', pastHero);
  };

  window.addEventListener('resize', update);

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
/* Header menu                                                                */
/* -------------------------------------------------------------------------- */

function initMenu() {
  const panel = $('#menuPanel');
  const toggle = $('#menuToggle');
  const header = $('#siteHeader');
  if (!panel || !toggle || !header) return;

  const body = $('.menu-panel__body', panel);
  if (!body) return;

  const reduced = prefersReducedMotion();
  const morphMs = reduced ? 0 : 800;
  const hideMs = reduced ? 0 : 820;
  let open = false;
  let openY = 0;
  let hideTimer = 0;
  let settleTimer = 0;

  /*
   * Split every label into two stacked copies so a hover can roll the
   * characters up one line, one character at a time. The anchor keeps the
   * readable text as its accessible name while the visual copy is hidden
   * from assistive technology.
   */
  $$('.menu-item__label', panel).forEach((label, index) => {
    const link = label.closest('a');
    const text = label.textContent.trim();
    if (!link || !text) return;

    link.setAttribute('aria-label', text);
    link.style.setProperty('--i', String(index));
    label.setAttribute('aria-hidden', 'true');
    label.textContent = '';

    [...text].forEach((char, charIndex) => {
      const clip = document.createElement('span');
      clip.className = 'roll__char';
      clip.style.setProperty('--c', String(charIndex));

      const track = document.createElement('span');
      track.className = 'roll__track';

      for (let copy = 0; copy < 2; copy += 1) {
        const glyph = document.createElement('span');
        glyph.className = 'roll__glyph';
        glyph.textContent = char === ' ' ? '\u00a0' : char;
        if (copy === 1) glyph.setAttribute('aria-hidden', 'true');
        track.append(glyph);
      }

      clip.append(track);
      label.append(clip);
    });
  });

  /*
   * On desktop the header is a 1728px canvas scaled down to the viewport, so
   * measuring the button and the bar anchors the panel to both at every
   * breakpoint. The panel itself lives outside the header and keeps its type
   * at the intended size.
   */
  const place = () => {
    const button = toggle.getBoundingClientRect();
    const bar = header.getBoundingClientRect();
    const top = Math.round(Math.max(button.bottom, bar.bottom) + 6);
    const right = Math.round(Math.max(8, window.innerWidth - button.right));
    const room = Math.min(window.innerWidth - right - 12, button.right - 12);
    const width = Math.max(200, Math.min(280, Math.round(room)));

    panel.style.top = `${top}px`;
    panel.style.right = `${right}px`;
    panel.style.setProperty('--menu-closed-w', `${Math.round(button.width)}px`);
    panel.style.setProperty('--menu-closed-h', `${Math.round(button.height)}px`);
    panel.style.setProperty('--menu-open-w', `${width}px`);
    panel.style.setProperty('--menu-max-h', `${Math.max(180, window.innerHeight - top - 12)}px`);

    return width;
  };

  /*
   * The panel's own height is still the closed pill when this runs, so read
   * the body's scroll height instead: it reports the full content even while
   * the panel clips it.
   */
  const measure = (width) => {
    const previousWidth = panel.style.width;
    const previousVisibility = panel.style.visibility;

    panel.style.transition = 'none';
    panel.style.visibility = 'hidden';
    panel.style.width = `${width}px`;
    const height = body.scrollHeight;
    panel.style.width = previousWidth;
    panel.style.visibility = previousVisibility;
    void panel.offsetHeight;
    panel.style.transition = '';

    return height;
  };

  const fit = (width) => {
    const max = Number.parseFloat(panel.style.getPropertyValue('--menu-max-h')) || window.innerHeight;
    panel.style.setProperty('--menu-open-h', `${Math.min(measure(width), max)}px`);
  };

  const setOpen = (next, { restoreFocus = false } = {}) => {
    if (next === open) return;
    open = next;
    window.clearTimeout(hideTimer);
    window.clearTimeout(settleTimer);

    toggle.setAttribute('aria-expanded', String(next));
    toggle.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');

    if (next) {
      openY = window.scrollY;
      const width = place();
      panel.hidden = false;
      panel.classList.remove('is-settled');
      fit(width);

      requestAnimationFrame(() => {
        if (!open) return;
        panel.classList.add('is-open');
        // The panel is visibility:hidden until this frame, so focus has to
        // wait for it to become visible.
        $('a[href]', panel)?.focus({ preventScroll: true });
        settleTimer = window.setTimeout(() => {
          if (open) panel.classList.add('is-settled');
        }, morphMs);
      });
      return;
    }

    panel.classList.remove('is-open', 'is-settled');
    hideTimer = window.setTimeout(() => {
      if (!open) panel.hidden = true;
    }, hideMs);
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(!open);
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) setOpen(false);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!open) return;
    if (panel.contains(event.target) || toggle.contains(event.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (!open || event.key !== 'Escape') return;
    event.preventDefault();
    setOpen(false, { restoreFocus: true });
  });

  document.addEventListener('focusin', (event) => {
    if (!open) return;
    if (panel.contains(event.target) || toggle.contains(event.target)) return;
    setOpen(false);
  });

  const closeOnScroll = () => {
    if (!open) return;
    if (Math.abs(window.scrollY - openY) > 4) setOpen(false);
  };
  if (state.lenis) state.lenis.on('scroll', closeOnScroll);
  else window.addEventListener('scroll', closeOnScroll, { passive: true });

  window.addEventListener('resize', () => {
    if (!open) return;
    fit(place());
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

function readCache(key = CACHE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data, key = CACHE_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
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

  /* Keep a readable floor: the scrub de-emphasises the old chat, it never
     renders either pane as a disabled skeleton. */
  gsap.set(cards, { opacity: 0.7, y: 10 });
  gsap.set(rows, { opacity: 1 });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: root,
        /* Finish as the section settles into view so the comparison is
           always read at full clarity, never mid-fade. */
        start: 'top bottom',
        end: 'top 72%',
        scrub: 0.6,
      },
    })
    .to(rows, { opacity: 0.85, y: -3, stagger: 0.06, duration: 1 }, 0)
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
/* Setup tabs (contribute.html)                                               */
/* -------------------------------------------------------------------------- */

function initSetupTabs() {
  const root = $('[data-setup-tabs]');
  if (!root) return;

  const tabs = $$('[data-setup-tab]', root);
  const panels = $$('[data-setup-panel]', root);
  if (!tabs.length || !panels.length) return;

  const activate = (name, moveFocus = false) => {
    tabs.forEach((tab) => {
      const selected = tab.dataset.setupTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.setupPanel !== name;
    });
  };

  const nameFromHash = () => (window.location.hash === '#setup-website' ? 'website' : 'app');

  // Deep links: #setup-app and #setup-website select the matching panel.
  activate(nameFromHash());

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.setupTab;
      activate(name);
      history.replaceState(null, '', `#setup-${name}`);
    });

    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      let next = null;

      if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
      else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;

      if (next === null) return;
      event.preventDefault();
      const target = tabs[next];
      activate(target.dataset.setupTab, true);
      history.replaceState(null, '', `#setup-${target.dataset.setupTab}`);
    });
  });

  window.addEventListener('hashchange', () => activate(nameFromHash()));
}

/* -------------------------------------------------------------------------- */
/* Download page                                                              */
/* -------------------------------------------------------------------------- */

async function detectOS() {
  // Client hints are opt-in and unavailable in many browsers; the UA is the fallback.
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues(['platform', 'architecture']);
      const platform = (hints.platform || navigator.userAgentData.platform || '').toLowerCase();
      if (platform.includes('win')) return { id: 'windows', label: 'Windows' };
      if (platform.includes('mac')) return { id: 'macos', label: 'macOS' };
      if (platform.includes('android')) return { id: 'mobile', label: 'your phone or tablet' };
      if (platform.includes('linux')) return { id: 'linux', label: 'Linux' };
    }
  } catch {
    /* fall through to the user agent */
  }

  const ua = navigator.userAgent || '';
  if (/android|iphone|ipad|ipod/i.test(ua)) return { id: 'mobile', label: 'your phone or tablet' };
  if (/windows/i.test(ua)) return { id: 'windows', label: 'Windows' };
  if (/mac os x|macintosh/i.test(ua)) return { id: 'macos', label: 'macOS' };
  if (/linux|x11|cros/i.test(ua)) return { id: 'linux', label: 'Linux' };
  return { id: 'unknown', label: 'your system' };
}

function formatSize(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${Math.round(mb)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function loadReleaseInfo() {
  const state = document.documentElement.dataset.releaseState;
  if (state === 'none') return null;

  const cached = readCache(RELEASE_CACHE_KEY);
  if (cached && typeof cached.version === 'string') return cached;

  const path = state === 'tag' && RELEASE_TAG ? `/releases/tags/${RELEASE_TAG}` : '/releases/latest';
  const release = await fetchJson(`https://api.github.com/repos/${CONFIG.APP_REPO}${path}`);
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const data = {
    version: String(release.tag_name || '').replace(/^v/, ''),
    sizes: Object.fromEntries(
      assets
        .filter((asset) => asset && typeof asset.name === 'string' && typeof asset.size === 'number')
        .map((asset) => [asset.name, asset.size]),
    ),
  };
  if (data.version) writeCache(data, RELEASE_CACHE_KEY);
  return data;
}

let toastTimer = null;

function showToast(message) {
  const toast = $('[data-dl-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

async function initDownloadPage() {
  const root = document.documentElement;
  if (!root.hasAttribute('data-release-state')) return;

  // The static state attribute is authoritative: the page is correct with JS off.
  const releaseState = root.dataset.releaseState;
  const isSet = releaseState !== 'none';
  const os = await detectOS();
  let macChip = 'arm64';
  let releaseInfo = null;

  const heroLink = $('.dl-hero__actions [data-dl-asset]');
  const osTitle = $('[data-dl-os-title]');
  const osSuffix = $('[data-dl-os-suffix]');
  const fileExt = $('[data-dl-hero-file-ext]');

  const currentAsset = () => {
    if (os.id === 'windows') return RELEASE_ASSETS.windows;
    if (os.id === 'linux') return RELEASE_ASSETS.linux;
    if (os.id === 'macos') return RELEASE_ASSETS[macChip === 'x64' ? 'mac-x64' : 'mac-arm64'];
    return RELEASE_ASSETS.windows;
  };

  const heroLabel = () => {
    if (os.id === 'macos') return macChip === 'x64' ? 'Download for Mac (Intel)' : 'Download for Mac';
    if (os.id === 'unknown' || os.id === 'mobile') return 'Download for your system';
    return `Download for ${os.label}`;
  };

  const updateSizes = () => {
    const sizes = releaseInfo?.sizes || {};
    const sizeChip = $('[data-dl-size]');
    $$('[data-dl-size-for]').forEach((node) => {
      node.textContent = formatSize(sizes[node.dataset.dlSizeFor]);
    });
    if (sizeChip) {
      const value = formatSize(sizes[currentAsset()]);
      sizeChip.textContent = value;
      sizeChip.hidden = !value;
    }
  };

  const applyOS = () => {
    const asset = currentAsset();
    // Keep the same wording shape as the static HTML. Longer mobile labels
    // ("your phone or tablet") would wrap to a new line and shift the card.
    const label = os.id === 'mobile' || os.id === 'unknown' ? 'your system' : os.label;
    if (osTitle) osTitle.textContent = `Download for ${label}`;
    if (osSuffix) osSuffix.textContent = ` for ${label}`;
    if (fileExt) {
      fileExt.textContent =
        os.id === 'windows'
          ? ', .exe'
          : os.id === 'linux'
            ? ', .AppImage'
            : os.id === 'macos'
              ? ', .dmg'
              : '';
    }

    $$('[data-dl-card]').forEach((card) => {
      card.classList.toggle('is-highlighted', card.dataset.dlCard === os.id);
    });

    const source = $$('[data-dl-asset]').find((link) => link.dataset.dlAsset === asset);
    if (heroLink && source && isSet) {
      heroLink.setAttribute('href', source.getAttribute('href'));
      heroLink.dataset.dlAsset = asset;
      heroLink.textContent = heroLabel();
    }
    updateSizes();
  };

  const macButtons = $$('[data-dl-mac-toggle]');
  const macPanels = $$('[data-dl-mac-panel]');
  const setMacChip = (chip) => {
    macChip = chip;
    macButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.dlMacToggle === chip));
    });
    macPanels.forEach((panel) => {
      panel.hidden = panel.dataset.dlMacPanel !== chip;
    });
    if (os.id === 'macos') applyOS();
  };
  macButtons.forEach((button) => {
    button.addEventListener('click', () => setMacChip(button.dataset.dlMacToggle));
  });

  applyOS();
  setMacChip('arm64');

  // Attach interactions before any network request, so a slow API cannot
  // delay a click, a copy or the email link.
  $$('[data-dl-asset]').forEach((link) => {
    link.addEventListener('click', () => {
      const version = ($('[data-dl-version]')?.textContent || '').trim() || 'beta';
      showToast(`Downloading TeleVault ${version}…`);
    });
  });

  const copyButton = $('[data-dl-copy-link]');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        if (!(await copyText(location.href))) return;
        const label = $('span', copyButton);
        if (label) label.textContent = 'Copied';
        showToast('Link copied');
        setTimeout(() => {
          if (label) label.textContent = 'Copy link';
        }, 2000);
      } catch {
        /* clipboard unavailable — leave the label alone */
      }
    });
  }

  const emailLink = $('[data-dl-email-link]');
  if (emailLink) {
    emailLink.href = `mailto:?subject=${encodeURIComponent('TeleVault download')}&body=${encodeURIComponent(
      `TeleVault for your desktop: ${location.href}`,
    )}`;
  }

  // Version and size come from the GitHub API. On failure the static version
  // chip stays and the size chip is hidden, so no dead values appear.
  if (isSet) {
    const sizeChip = $('[data-dl-size]');
    if (sizeChip) sizeChip.hidden = false;
    const timeout = setTimeout(() => {
      if (sizeChip) sizeChip.hidden = true;
    }, 10000);

    try {
      releaseInfo = await loadReleaseInfo();
      if (releaseInfo?.version) {
        const versionChip = $('[data-dl-version]');
        if (versionChip) versionChip.textContent = `v${releaseInfo.version}`;
      }
      updateSizes();
    } catch {
      if (sizeChip) sizeChip.hidden = true;
      $$('[data-dl-size-for]').forEach((node) => {
        node.textContent = '';
      });
    } finally {
      clearTimeout(timeout);
      const skeleton = sizeChip ? $('[data-skeleton]', sizeChip) : null;
      if (skeleton) skeleton.remove();
    }
  }
}

function initDownloadTabs() {
  const root = $('[data-dl-tabs]');
  if (!root) return;

  const tabs = $$('[data-dl-tab]', root);
  const panels = $$('[data-dl-panel]', root);
  if (!tabs.length || !panels.length) return;

  const names = tabs.map((tab) => tab.dataset.dlTab);
  const activate = (name, moveFocus = false) => {
    tabs.forEach((tab) => {
      const selected = tab.dataset.dlTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.dlPanel !== name;
    });
  };

  const nameFromHash = () => {
    const hash = window.location.hash.slice(1);
    return names.includes(hash) ? hash : names[0];
  };

  activate(nameFromHash());

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.dlTab;
      activate(name);
      history.replaceState(null, '', `#${name}`);
    });

    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      let next = null;
      if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
      else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      if (next === null) return;
      event.preventDefault();
      const target = tabs[next];
      activate(target.dataset.dlTab, true);
      history.replaceState(null, '', `#${target.dataset.dlTab}`);
    });
  });

  window.addEventListener('hashchange', () => activate(nameFromHash()));
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
  initMenu();
  initAccordion();
  initGithubStats();
  initCopyButtons();
  initTerminalTyping();
  initProblemSort();
  initHowItWorks();
  initTilt();
  initDocsToc();
  initSetupTabs();
  initDownloadTabs();
  initDownloadPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
