# TeleVault — Landing Page Build Prompt

Use this document as the prompt for whatever tool builds the page (Claude Code, Cursor, v0, or Claude itself). It fully specifies a **pixel-matched recreation of the reference screenshot** plus the interaction layer (scroll, transitions, type) on top of it.

---

## 0. Product context

**TeleVault** turns a user's Telegram "Saved Messages" / cloud storage into a real desktop file manager: folders, search, previews, drag-and-drop upload, all from one clean interface. The landing page's only job is to sell that one idea fast and get the click on "Get TeleVault."

Assets the user will supply — treat as drop-in, don't regenerate:

- `bg-sky.jpg` — the cloud/sky background image used full-bleed behind the hero
- `logo-televault.svg` (or .png) — the paw/wordmark logo, dark variant for light backgrounds

---

## 1. Design plan (token system)

**Color**

| Token         | Hex                      | Use                                           |
| ------------- | ------------------------ | --------------------------------------------- |
| `--ink`       | `#14181F`                | headline text, nav pills, buttons             |
| `--sky-light` | `#DCE9F5`                | overlay tint on the bg photo, light UI chrome |
| `--sky-deep`  | `#5C86AC`                | shadow/gradient pass over the photo edges     |
| `--paper`     | `#FFFFFF`                | button text, subtle chrome fills              |
| `--mist`      | `rgba(255,255,255,0.55)` | glass panel fill (the screenshot frame)       |
| `--muted-ink` | `rgba(20,24,31,0.65)`    | subhead copy, nav labels                      |

Do not reach for the generic cream/terracotta or dark+neon palettes — this brief already has a real hero image (sky), so the palette's job is to stay quiet and let the photo and the black UI chrome carry the contrast.

**Type — pairing**

> UPDATED FROM FIGMA GROUND TRUTH (overrides the original guess below):
>
> - **Headline:** Inter, Medium 500, ~85px
> - **Script accent word "vault":** Lily Script One, Regular 400
> - **Subhead:** Poppins, Medium 500
> - **Nav items:** Inter, Regular 400
> - **CTA buttons:** IBM Plex Sans, Medium 500 (primary) / Regular 400 ("Already bought it?")
>
> Original guess (superseded, kept for reference only):
>
> - Display/headline: Söhne or General Sans — **incorrect, actual file uses Inter**
> - Accent script: Instrument Serif Italic or Caveat — **incorrect, actual file uses Lily Script One**
> - Body: Inter or General Sans — **incorrect, actual file uses Poppins (subhead) and IBM Plex Sans (buttons)**

Four real, resolved font families are used in the hero: Inter, Lily Script One, Poppins, IBM Plex Sans. None are fallbacks — use these exact names in the build.

**Layout**

┌───────────────────────────────────────────────┐
│ logo [pill nav: 4 links] CTA ● avatar │ ← sticky, transparent → blurred on scroll
│ │
│ headline (2 lines, │
│ center aligned, script accent) │
│ short 3-line subhead │
│ [Get TeleVault] Already bought it? │
│ │
│ ┌──────────────────────────┐ │
│ │ glass product frame │ │
│ │ (currently empty in │
│ │ Figma — build as-is) │ │
│ └──────────────────────────┘ │
└───────────────────────────────────────────────┘

Confirmed exact values from Figma (file `W5or6wtBZf5hqZtpBV0Yjn`, frame `6:2`, artboard 1728×1117, fill `#FFFFFF`, no auto-layout — everything absolutely positioned):

| Element            | Node  | Pos (x,y) | Size      | Fill / notes                                                                                                |
| ------------------ | ----- | --------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| Background image   | 8:4   | 21,19     | 1685×1126 | raster, stroke `#FFFFFF`                                                                                    |
| Logo               | 11:7  | 145,45    | 193×44    | raster image                                                                                                |
| Nav pill           | 15:2  | 666,48    | 472×38    | `rgba(187,187,187,0.26)`, stroke `#D7D5D5` 1px, radius 40                                                   |
| Avatar/menu icon   | 15:4  | 1581,52   | 45×45     | `rgba(187,187,187,0.26)`, stroke `#D7D5D5` 1px                                                              |
| Header CTA pill    | 15:3  | 1433,52   | 140×45    | `rgba(0,0,0,0.79)`                                                                                          |
| Hero CTA pill      | 26:74 | 731,459   | 164×50    | `rgba(0,0,0,0.79)`                                                                                          |
| Glass mockup panel | 15:13 | 415,557   | 985×562   | `rgba(171,171,171,0.62)`, stroke `#C6C6C6` 2.5px, radius 30px, shadow `0 3px 116.2px 16px rgba(0,0,0,0.25)` |

Text content, confirmed: headline `#000000` — "Your files. Your Telegram. / Your vault." (line break after "Your", "vault" in script font). Subhead `#FFFFFF` — "…manage your files from one clean interface ." (note: trailing space before the period in the source). Nav labels `#FFFFFF` except "How it Works" which is `#FFFAFA`.

**Principles**

1. The photo _is_ the hero — no illustration competes with it. Every other element (nav pill, buttons, glass frame) is translucent or dark-on-light so the sky stays legible.
2. One typographic flourish only: the word "vault" in Lily Script One. Nothing else gets italic, color, or a different weight.
3. Motion answers scroll and load, not hover-spam — a single orchestrated entrance, not fade-ups on every element.
4. Glass, not shadow-card: the product frame uses the exact translucent fill + blur + shadow values above, not a generic SaaS drop-shadow card.
5. The mockup panel (`15:13`) is confirmed empty in the source file — build it as an empty glass panel using the exact CSS values above. Do not invent placeholder screenshot content inside it unless separately asked to.

---

## 2. Exact hero spec (must match Figma + reference image)

- **Header bar:** transparent over the photo. Left: logo raster image at 145,45 / 193×44. Center: nav pill at 666,48 / 472×38, containing `Features · How it Works · Security · Pricing` — plain weight Inter, no dividers, no caps. Right: solid black pill CTA at 1433,52 / 140×45 ("Get TeleVault", white IBM Plex Sans text) next to a circular icon/avatar at 1581,52 / 45×45.
- **Headline:** Inter Medium 500, ~85px, `#000000`, two centered lines — "Your files. Your Telegram." / "Your _vault_." — only "vault" swapped to Lily Script One at the same size.
- **Subhead:** Poppins Medium 500, `#FFFFFF`, centered, ends with "…manage your files from one clean interface ." (trailing space before the period, per source).
- **CTA row:** black pill at 731,459 / 164×50 ("Get TeleVault", IBM Plex Sans Medium 500) + plain text link "Already bought it?" (IBM Plex Sans Regular 400), side by side.
- **Glass mockup panel:** 415,557 / 985×562, exact fill/stroke/radius/shadow as specified above — empty, no nested content.
- **Background:** the supplied sky photo at 21,19 / 1685×1126, `background-size: cover`, with a very light white gradient wash at the very top so the logo and nav text stay readable.

---

## 3. Stack & libraries

- **Framework:** plain HTML/CSS/JS. One stylesheet (`styles.css`), one ES module (`script.js`), no build step.
- **Styling:** hand-written CSS on top of a **minimal preflight** that replaces the Tailwind CDN reset. The hero relies on zeroed heading/paragraph margins and `display:block` media, so the preflight is load-bearing — do not delete it. The Tailwind CDN was removed because it blocked first paint and injected a full utility runtime for a page that uses none of it.
- **Smooth scroll:** [Lenis](https://github.com/darkroomengineering/lenis) `1.3.27`, self-hosted in `assets/vendor/lenis/`.
- **Scroll/entrance animation:** GSAP `3.15.1` + ScrollTrigger, self-hosted in `assets/vendor/gsap/`.
- **Icons:** Lucide `1.73.0`, self-hosted. The full UMD bundle is ~115 KB, so `npm run vendor` generates `assets/vendor/lucide/lucide-subset.js` containing only the icons referenced by `data-lucide`. It exposes the same `lucide.createIcons()` API.
- **Fonts:** Inter, Poppins, IBM Plex Sans, IBM Plex Mono, Lily Script One — self-hosted woff2 subsets in `assets/fonts/` with `assets/fonts.css`. No Google Fonts request.

All vendor files are pinned in `package.json`, copied by `npm run vendor`, and committed so the site works without a build step.

## 4. Motion rules (restraint)

- **One reveal pattern, used everywhere.** `[data-reveal]` fades up 24px out of a 6px blur over 800ms on `--ease-out`, staggered by `--reveal-i` (60ms). No per-section bespoke entrances.
- **Three scrubbed moments, and no more:**
  1. **Problem → solution sort** (`#problem`) — the loose message list fades back while the sorted file list fades in.
  2. **How it works** (`#how-it-works`) — sticky steps, one active per scroll segment.
  3. **Terminal typing** (`#contribute`) — the quick-start command types itself once the block is in view.
- **Hero:** the load-in and the pinned scrub are unchanged from the frozen spec. The pin trigger is sized to the scaled 1728×1117 canvas so the hero scrolls out exactly as the next section arrives, with no empty scroll runway. The sky background fills the full pin and fades into the hero fade at its bottom edge, so the photo never meets the page with a hard line. The hero is the only place with a bespoke timeline.
- **Header:** chrome gains glass (`.is-blurred`) once the hero has scrolled past; before that it is transparent.
- **Scrollspy:** the nav pill slides to the active link (`.is-active` + `aria-current="true"`); the docs TOC uses the same class/attribute contract.
- **Counters:** repo stat numbers count up once, only when they have a real value from the API.
- **Buttons:** 150ms ease `translateY(-1px)` on hover — no gradient shifts, no bounce.
- **Lenis:** `duration 1.1`, `easing` ≈ expo-out, `smoothWheel` on, anchors handled through Lenis.
- **View Transitions:** `@view-transition { navigation: auto }` with a short cross-fade; harmless where unsupported.
- **`prefers-reduced-motion: reduce`:** Lenis is never initialised, all scrubbed timelines and pins are skipped, `[data-reveal]` renders at its final state with no transform, the tilt and marquee stop, and the hero video stays on its poster frame.

## 5. Below-the-fold sections (as built)

Order on `index.html`, after the hero:

1. **Trust strip** — open source, MIT, live GitHub stars (hidden below 10), platforms, repo link. Only live GitHub data; no invented counts.
2. **Problem → solution** (`#problem`) — the "Saved Messages" mess on the left, the TeleVault file tree on the right, with the sort scrub between them.
3. **Why not just use…** (`#compare`) — three honest columns: Telegram alone, a cloud drive, TeleVault. No competitor logos or prices.
4. **Features bento** (`#features`) — folder tree, search, preview, drag-and-drop upload. Stills come from the product clip.
5. **How it works** (`#how-it-works`) — three sticky steps: connect Telegram → pick your folders → manage it like a drive.
6. **Security** (`#security`) — "what it does / what it never does" pair, plus a short trust list. Claims are limited to what the source can back up.
7. **Contribute** (`#contribute`) — replaces the old Pricing section. Live repo stats, three contribution paths, terminal quick start (copy + typing), the five newest `good first issue` entries, contributor avatar marquee, and explicit empty/error states.
8. **FAQ** (`#faq`) — eleven questions, one open at a time, real `<button>` + `aria-expanded`/`aria-controls` accordion.
9. **Final CTA** — one primary action, no pricing language anywhere on the page.
10. **Footer** — brand, four link columns, legal note, and the wordmark watermark.

`contribute.html` is the designed version of `CONTRIBUTING.md`: sticky TOC with scrollspy, 720px reading column, 13 sections, callouts, copyable code blocks with language labels, "Edit this page on GitHub", prev/next, breadcrumb, and a mobile TOC drawer.

### Extended tokens

Beyond the original palette: `--surface`, `--line`, `--line-strong`, `--accent`, `--accent-soft`, `--radius-s|m|l|xl`, `--container`, `--gutter`, `--section-y`, `--shadow-soft`, `--shadow-lift`, `--font-mono`, `--font-script`, `--ease-out`. The hero keeps its original hard-coded geometry; none of these tokens are used inside it.

### Responsive breakpoints

`640px`, `900px`, `1200px`. Below 640 the bento collapses to one column, the comparison stacks, the sticky steps become a plain list, the footer goes 2×2, and the mobile nav becomes a full-screen sheet with a focus trap and Esc. Interactive controls are ≥44×44px.

## 6. Copy voice

Plain, confident, no marketing fluff or exclamation points. Buttons say exactly what happens: "Get TeleVault," not "Learn More."

---

### Drop-in checklist for the builder

- [x] Replace `bg-sky.jpg` and `logo-televault.svg` placeholders with supplied assets (sky re-encoded to AVIF/WebP, logo kept as the supplied PNG)
- [x] Match hero layout to the exact node positions/sizes in §1–2 (not just visually close)
- [x] Build the glass mockup panel exactly per the confirmed empty-panel CSS
- [x] Load Inter, Lily Script One, Poppins, IBM Plex Sans (self-hosted)
- [x] Wire up Lenis smooth scroll globally
- [x] Build the one headline load-in animation
- [x] Confirm mobile breakpoint: nav collapses to logo + menu icon, headline drops to ~32px, glass frame goes full-width with less inset
