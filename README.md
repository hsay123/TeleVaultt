# TeleVault

**Your files. Your Telegram. Your vault.**

TeleVault turns your Telegram cloud storage into a proper desktop file manager. Organize, search, preview and upload from one clean interface, without moving your files to another cloud.

[![CI](https://github.com/hsay123/TeleVaultt/actions/workflows/ci.yml/badge.svg)](https://github.com/hsay123/TeleVaultt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-14181f.svg)](LICENSE)

- **Free and open source.** MIT licensed. Read it, build it, change it.
- **No new cloud.** Your files stay in the Telegram account you already use.
- **No account with us.** TeleVault is a client, not a storage provider.

## Repositories

| What                                           | Repository                                                  |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Desktop app (the product)                      | [hsay123/TGDrive](https://github.com/hsay123/TGDrive)       |
| Website and contributor docs (this repository) | [hsay123/TeleVaultt](https://github.com/hsay123/TeleVaultt) |

## Quick start

These steps are for the website. For the desktop app, see [TGDrive](https://github.com/hsay123/TGDrive).

You need [Node.js](https://nodejs.org/) 22.22 or newer and Git.

```bash
git clone https://github.com/hsay123/TeleVaultt.git
cd TeleVaultt
npm install && npm run dev
```

The site is served at <http://127.0.0.1:4173>. There is no build step: the browser loads `index.html`, `styles.css` and `script.js` directly.

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Static server on port 4173                   |
| `npm run format`       | Format every file with Prettier              |
| `npm run format:check` | Fail if anything is unformatted              |
| `npm run lint`         | Validate the HTML with `html-validate`       |
| `npm run check:links`  | Crawl the local site and report broken links |
| `npm run lighthouse`   | Run Lighthouse CI against the local build    |
| `npm run vendor`       | Re-copy the pinned browser libraries         |

## Project structure

```text
.
├── index.html            Landing page
├── contribute.html       Contributing guide, designed
├── 404.html              Not-found page
├── styles.css            Every style for both pages
├── script.js             One ES module, one CONFIG block
├── assets/
│   ├── fonts.css         Generated @font-face rules
│   ├── fonts/            Self-hosted woff2 files
│   ├── img/              Stills, Open Graph image, icons
│   ├── vendor/           Lenis, GSAP, ScrollTrigger, Lucide
│   └── videos/           Showcase video and poster
├── scripts/vendor.mjs    Copies pinned libraries from npm
├── docs/seed-issues.md   Drafts for good first issues
├── design.md             Design tokens, type and motion rules
└── package.json          Scripts and pinned dependencies
```

## Editing the site

- **Copy and layout** live in `index.html`. Sections are in reading order and each one is commented.
- **Styling** is a single stylesheet, `styles.css`. Tokens are defined once in `:root` and reused.
- **Behaviour** is `script.js`. Every initialiser feature-detects its DOM and fails silently.
- **Live GitHub data** (stars, forks, issues, contributors) is fetched client-side and cached in `localStorage` for one hour. `CONFIG` at the top of `script.js` keeps the app repo (`APP_REPO`/`APP_URL`) and this site's repo (`WEB_REPO`/`WEB_URL`) separate; change the matching constant, never one shared one.

The hero layout is intentionally frozen. Its canvas is a 1728 × 1117 design scaled with a transform, so changing its internal spacing breaks the match. See `design.md` §1a.

### Pinned browser libraries

| Library | Version | Purpose                  |
| ------- | ------- | ------------------------ |
| Lenis   | 1.3.27  | Smooth scrolling         |
| GSAP    | 3.15.1  | Timeline + ScrollTrigger |
| Lucide  | 1.73.0  | Icon set                 |

They are self-hosted in `assets/vendor/`. Run `npm run vendor` after changing a version in `package.json`.

## Accessibility

The site targets WCAG 2.2 AA: landmarks, a skip link, one `h1` per page, logical heading order, visible focus rings, ARIA-correct accordions and menus, and full keyboard support. `prefers-reduced-motion: reduce` disables smooth scrolling, scrubbed animation and hover tilt.

If you find a barrier, please open an issue with the `a11y` label.

## Security

Do not report vulnerabilities in a public issue. Use GitHub's private [Security Advisories](https://github.com/hsay123/TeleVaultt/security/advisories/new) flow. See [SECURITY.md](SECURITY.md).

## Contributing

Contributions of every size are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) or the designed version at [contribute.html](contribute.html).

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Good first issues](https://github.com/hsay123/TGDrive/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

## License

[MIT](LICENSE) © TeleVault contributors.

TeleVault is an independent open-source project and is not affiliated with or endorsed by Telegram.
