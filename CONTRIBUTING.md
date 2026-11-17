# Contributing to TeleVault

Thanks for taking the time to contribute. TeleVault is an open-source project built in public, and every issue, pull request and review makes it better.

This guide is the single source of truth for contributing. The designed version lives at [contribute.html](contribute.html) and says the same thing.

> **A note on scope:** this repository currently contains the TeleVault website and this contributor documentation. If the desktop application lives in a separate repository, add the link here before promoting the project. <!-- VERIFY: location of the desktop app source code -->

## Welcome

You do not need permission to start. Read an issue, ask a question, open a pull request. Small contributions are welcome: a typo fix, a better screenshot, one accessibility fix.

Before you start, please read the [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to follow it.

## Ways to contribute

| Path                  | Good for                                    | Where to start                                                                                                                           |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Fix a bug             | People who like a clear reproduction        | Issues labelled [`good first issue`](https://github.com/hsay123/TeleVaultt/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) |
| Build a feature       | People who want to shape the product        | Open a [feature request](https://github.com/hsay123/TeleVaultt/issues/new?template=feature_request.yml) first                            |
| Improve docs & design | Writers, designers, accessibility reviewers | Anything in `README.md`, `contribute.html` or `styles.css`                                                                               |

You can also help by triaging issues, answering questions in [Discussions](https://github.com/hsay123/TeleVaultt/discussions), or reviewing another contributor's pull request.

## Set up locally

You need [Node.js](https://nodejs.org/) 20 or newer and Git.

```bash
git clone https://github.com/hsay123/TeleVaultt.git
cd TeleVaultt
npm install && npm run dev
```

The site is served at <http://127.0.0.1:4173>. There is no build step: the browser loads `index.html`, `styles.css` and `script.js` directly.

Useful commands:

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Static server on port 4173                                |
| `npm run format`       | Format every file with Prettier                           |
| `npm run format:check` | Fail if anything is unformatted                           |
| `npm run lint`         | Validate the HTML with `html-validate`                    |
| `npm run check:links`  | Crawl the local site and report broken links              |
| `npm run lighthouse`   | Run Lighthouse CI against the local build                 |
| `npm run vendor`       | Re-copy the pinned browser libraries into `assets/vendor` |

> **Tip:** if port 4173 is busy, run `npx http-server . -p 5000 -c-1` instead.

## Project structure

```text
.
├── index.html            Landing page
├── contribute.html       This guide, designed
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

Keep `styles.css` as the single stylesheet. Do not add a second CSS pipeline.

## Your first PR

1. **Find or open an issue.** Comment on it so nobody duplicates the work. For anything larger than a typo, wait for a maintainer to agree on the approach.
2. **Fork and branch.** `git switch -c fix/footer-focus-ring`
3. **Make the change.** Keep it scoped to one concern.
4. **Run the checks.** `npm run format && npm run lint && npm run check:links`
5. **Commit** using the convention below.
6. **Open a pull request** and fill in the template. Link the issue with `Closes #123`.
7. **Respond to review.** Push follow-up commits; do not force-push during review.

## Branch & commit conventions

Branches use `<type>/<short-slug>`:

```text
feat/contribute-terminal
fix/mobile-menu-focus
docs/setup-instructions
a11y/accordion-labels
perf/lazy-feature-images
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<optional scope>): <short imperative summary>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `a11y`.

```text
feat(contribute): load repo stats from the GitHub API
fix(nav): keep the scrollspy pill inside the header at 1024px
docs(contributing): explain how to run the link checker
```

Write the summary in the imperative mood, keep it under 72 characters, and use the body to explain _why_.

## Code & design style

- **HTML:** semantic elements, one `h1` per page, logical heading order, `alt` on every meaningful image, `aria-*` only where native semantics are not enough.
- **CSS:** use the tokens in `design.md` (`--ink`, `--surface`, `--line`, `--accent`, radii, spacing). Do not hard-code a new colour if a token exists.
- **JavaScript:** one ES module. Every initialiser must feature-detect its DOM and fail silently. Never add a library for something the platform already does.
- **Copy:** plain, confident, no exclamation points. Buttons say what happens.
- **Motion:** one reveal pattern, at most three scrubbed moments. Respect `prefers-reduced-motion`.
- **Formatting:** Prettier decides. Do not argue with it in review.

> **Warning:** the hero layout is frozen. Do not change its sizing, positions or background. The only accepted hero changes are copy edits approved in an issue.

## Testing & checks

Run before every pull request:

```bash
npm run format:check
npm run lint
npm run check:links
```

For visual changes, also check:

- 360 px, 768 px, 1280 px and 1920 px widths
- keyboard-only navigation (Tab, Shift+Tab, Enter, Space, Escape)
- `prefers-reduced-motion: reduce` (no smooth scroll, no scrubbed animation, no tilt)
- no console errors and no horizontal scrollbar
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95

> **Tip:** the GitHub data layer caches responses in `localStorage` for one hour. To test the loading and error states, clear `televault:github:v1` in DevTools and throttle the network.

## Review process

1. A maintainer reviews within the response-time expectation below.
2. CI must pass: Prettier, `html-validate`, link check and Lighthouse.
3. One approval is enough for docs, copy and small fixes. Larger changes need a second review.
4. Squash-merge with a Conventional Commit title.

**Response-time expectation (owner decision):** maintainers aim to respond to a new issue or pull request within **7 days**. If a pull request has had no response after 7 days, mention the maintainer in the thread. This is a best-effort target for a volunteer project, not a service-level agreement.

## Reporting bugs

Use the [bug report template](https://github.com/hsay123/TeleVaultt/issues/new?template=bug_report.yml). Include:

- what you expected and what happened
- steps to reproduce, as short as possible
- your operating system, browser or app version
- screenshots or a console log if they help

Please search existing issues first. Do not open a public issue for a security problem.

## Security reports

Do not report vulnerabilities in a public issue. Use GitHub's private [Security Advisories](https://github.com/hsay123/TeleVaultt/security/advisories/new) flow. See [SECURITY.md](SECURITY.md) for supported versions and the disclosure timeline.

## Code of Conduct

All participation is covered by the [Code of Conduct](CODE_OF_CONDUCT.md). Report unacceptable behaviour to the contact listed there. Maintainers will review reports confidentially.

## Recognition

Every contributor is listed on the GitHub contributors graph and in the Contribute section of the site. Significant contributions are credited in [CHANGELOG.md](CHANGELOG.md). There is no contributor licence agreement: by opening a pull request you agree that your contribution is released under the [MIT License](LICENSE).
