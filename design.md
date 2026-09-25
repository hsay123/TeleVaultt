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
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#14181F` | headline text, nav pills, buttons |
| `--sky-light` | `#DCE9F5` | overlay tint on the bg photo, light UI chrome |
| `--sky-deep` | `#5C86AC` | shadow/gradient pass over the photo edges |
| `--paper` | `#FFFFFF` | button text, subtle chrome fills |
| `--mist` | `rgba(255,255,255,0.55)` | glass panel fill (the screenshot frame) |
| `--muted-ink` | `rgba(20,24,31,0.65)` | subhead copy, nav labels |

Do not reach for the generic cream/terracotta or dark+neon palettes — this brief already has a real hero image (sky), so the palette's job is to stay quiet and let the photo and the black UI chrome carry the contrast.

**Type — pairing**

> UPDATED FROM FIGMA GROUND TRUTH (overrides the original guess below):
> - **Headline:** Inter, Medium 500, ~85px
> - **Script accent word "vault":** Lily Script One, Regular 400
> - **Subhead:** Poppins, Medium 500
> - **Nav items:** Inter, Regular 400
> - **CTA buttons:** IBM Plex Sans, Medium 500 (primary) / Regular 400 ("Already bought it?")
>
> Original guess (superseded, kept for reference only):
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

| Element | Node | Pos (x,y) | Size | Fill / notes |
|---|---|---|---|---|
| Background image | 8:4 | 21,19 | 1685×1126 | raster, stroke `#FFFFFF` |
| Logo | 11:7 | 145,45 | 193×44 | raster image |
| Nav pill | 15:2 | 666,48 | 472×38 | `rgba(187,187,187,0.26)`, stroke `#D7D5D5` 1px, radius 40 |
| Avatar/menu icon | 15:4 | 1581,52 | 45×45 | `rgba(187,187,187,0.26)`, stroke `#D7D5D5` 1px |
| Header CTA pill | 15:3 | 1433,52 | 140×45 | `rgba(0,0,0,0.79)` |
| Hero CTA pill | 26:74 | 731,459 | 164×50 | `rgba(0,0,0,0.79)` |
| Glass mockup panel | 15:13 | 415,557 | 985×562 | `rgba(171,171,171,0.62)`, stroke `#C6C6C6` 2.5px, radius 30px, shadow `0 3px 116.2px 16px rgba(0,0,0,0.25)` |

Text content, confirmed: headline `#000000` — "Your files. Your Telegram. / Your vault." (line break after "Your", "vault" in script font). Subhead `#FFFFFF` — "…manage your files from one clean interface ." (note: trailing space before the period in the source). Nav labels `#FFFFFF` except "How it Works" which is `#FFFAFA`.

**Principles**
1. The photo *is* the hero — no illustration competes with it. Every other element (nav pill, buttons, glass frame) is translucent or dark-on-light so the sky stays legible.
2. One typographic flourish only: the word "vault" in Lily Script One. Nothing else gets italic, color, or a different weight.
3. Motion answers scroll and load, not hover-spam — a single orchestrated entrance, not fade-ups on every element.
4. Glass, not shadow-card: the product frame uses the exact translucent fill + blur + shadow values above, not a generic SaaS drop-shadow card.
5. The mockup panel (`15:13`) is confirmed empty in the source file — build it as an empty glass panel using the exact CSS values above. Do not invent placeholder screenshot content inside it unless separately asked to.

---

## 2. Exact hero spec (must match Figma + reference image)

- **Header bar:** transparent over the photo. Left: logo raster image at 145,45 / 193×44. Center: nav pill at 666,48 / 472×38, containing `Features · How it Works · Security · Pricing` — plain weight Inter, no dividers, no caps. Right: solid black pill CTA at 1433,52 / 140×45 ("Get TeleVault", white IBM Plex Sans text) next to a circular icon/avatar at 1581,52 / 45×45.
- **Headline:** Inter Medium 500, ~85px, `#000000`, two centered lines — "Your files. Your Telegram." / "Your *vault*." — only "vault" swapped to Lily Script One at the same size.
- **Subhead:** Poppins Medium 500, `#FFFFFF`, centered, ends with "…manage your files from one clean interface ." (trailing space before the period, per source).
- **CTA row:** black pill at 731,459 / 164×50 ("Get TeleVault", IBM Plex Sans Medium 500) + plain text link "Already bought it?" (IBM Plex Sans Regular 400), side by side.
- **Glass mockup panel:** 415,557 / 985×562, exact fill/stroke/radius/shadow as specified above — empty, no nested content.
- **Background:** the supplied sky photo at 21,19 / 1685×1126, `background-size: cover`, with a very light white gradient wash at the very top so the logo and nav text stay readable.

---

## 3. Stack & libraries

- **Framework:** plain HTML/CSS/JS (or React if the rest of the site needs componentization) — keep it framework-light since this is a single marketing page.
- **Styling:** Tailwind CSS for utility layout + a small custom CSS layer for the glass panel and type scale.
- **Smooth scroll:** [Lenis](https://github.com/darkroomengineering/lenis) — lightweight, buttery inertia scroll.
- **Scroll/entrance animation:** GSAP + ScrollTrigger, or Framer Motion if using React. Use for exactly two things:
  1. **Headline reveal on load:** split the two headline lines into words, each word blurs-in + rises 12px + fades in with a ~40ms stagger, total sequence under 900ms.
  2. **Header chrome on scroll:** nav pill and header background gain a subtle blur + opacity once the user scrolls past the hero.
- **Icons (avatar/menu):** Lucide.
- **Fonts:** Inter, Lily Script One, Poppins, IBM Plex Sans — all loadable via Google Fonts.

## 4. Motion rules (restraint)

- Only the hero headline gets a load-in sequence. No fade-up-on-scroll for every section below — pick **one** additional scroll moment and stop there.
- Buttons get a simple 150ms ease transform (translateY(-1px)) on hover — no color-shifting gradients, no bounce.
- Respect `prefers-reduced-motion`: disable the stagger/blur reveal and fall back to a plain fade.

## 5. Below-the-fold sections (not shown in reference, to be authored)

1. **Features** — 3–4 short feature blocks (Organize, Search, Preview, Upload).
2. **How it Works** — 3 actual sequential steps (Connect Telegram → Sync your files → Manage like a drive).
3. **Security** — one clear paragraph on what TeleVault does/doesn't store, plus a short trust list.
4. **Pricing** — one clean pricing card (single plan — "Already bought it?" implies one-time purchase, not tiers).
5. **Footer** — logo, one-line tagline, links.

## 6. Copy voice

Plain, confident, no marketing fluff or exclamation points. Buttons say exactly what happens: "Get TeleVault," not "Learn More."

---

### Drop-in checklist for the builder
- [ ] Replace `bg-sky.jpg` and `logo-televault.svg` placeholders with supplied assets
- [ ] Match hero layout to the exact node positions/sizes in §1–2 (not just visually close)
- [ ] Build the glass mockup panel exactly per the confirmed empty-panel CSS
- [ ] Load Inter, Lily Script One, Poppins, IBM Plex Sans
- [ ] Wire up Lenis smooth scroll globally
- [ ] Build the one headline load-in animation
- [ ] Confirm mobile breakpoint: nav collapses to logo + menu icon, headline drops to ~32px, glass frame goes full-width with less inset