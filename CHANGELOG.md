# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Landing page sections: trust strip, problem → solution, comparison, feature
  bento, how it works, security, contribute, FAQ, final call to action.
- Contribute section with live GitHub repository stats, good-first issues,
  contributor avatars and a copyable quick start terminal.
- `contribute.html`: a designed contributor guide with sticky table of
  contents, scrollspy, callouts, code blocks and previous/next navigation.
- Contributor documentation: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, issue and pull request templates, `CODEOWNERS` and label set.
- `404.html`, `robots.txt`, `sitemap.xml` and a web app manifest.
- CI workflow (format, lint, link check, repo-link guard, browser tests,
  Lighthouse) and a Vercel deployment (`vercel.json` + `scripts/build-site.mjs`).
- Self-hosted fonts and pinned browser libraries (Lenis, GSAP, ScrollTrigger,
  Lucide) under `assets/`.

### Changed

- The site deploys on Vercel at `https://televault-silk.vercel.app` instead of
  GitHub Pages. Canonical, Open Graph, sitemap, robots and JSON-LD URLs use the
  Vercel host, and only the files the site serves are published.
- Split repository links: product links (Contribute, downloads, issues, stats,
  JSON-LD) now point at the app repository `hsay123/TGDrive`, while website and
  documentation links stay on `hsay123/TeleVaultt`.
- `contribute.html` and `CONTRIBUTING.md` now explain which repository to use and
  separate app and website setup steps.
- Removed Discussions links because Discussions is not enabled on either
  repository.
- Navigation: "Pricing" is replaced by "Contribute"; the hero secondary action
  now reads "View on GitHub" and opens the repository in a new tab.
- Removed all pricing and purchase language. Download links point at the
  repository because no releases are published yet.
- Removed the Tailwind CDN; the page ships hand-written CSS only.
- Contribute: the dark panel is narrower and centred, with tighter padding and
  internal spacing, so the heading, stats, terminal and cards read as one
  compact card without losing any content.
- Contribute: the whole section now fits in one desktop viewport below the fixed
  header (1920×1080, 1440×900, 1366×768). Desktop spacing is derived from the
  viewport height, and from 1200px the quick-start terminal, issue list and
  contributor avatars share a single row instead of stacking. Tablet and mobile
  keep the stacked layout and scroll normally.

### Fixed

- Restored a single `<main>` landmark by turning the hero wrapper into a `div`.
- Removed the Google Fonts request in favour of self-hosted files, eliminating a
  third-party render-blocking request.
- Removed the empty viewport of paper between the hero and the trust strip: the
  hero pin trigger is sized to the scaled 1728×1117 canvas instead of a fixed
  `200vh`, so the hero scrolls out exactly as the next section arrives.
- Closed the white band that could still appear under the sky: the hero
  background now fills the full pin instead of `100vh`, and its bottom edge
  fades through pale blue into the hero fade so the image never meets the page
  with a hard line. The mobile fade carries the same hand-off, and the fixed
  mobile sky no longer paints over the fade and trust strip.
- Navbar: the header no longer paints a white glass rectangle over the hero
  photo. The glass state was triggered by a scroll offset while the pinned hero
  still held the sky behind the bar; it now engages only once the hero's bottom
  edge passes the header, so the sky stays visible behind a transparent bar.
  Over the photo the nav links take the same ink colour as the hero headline so
  they stay readable on the light sky.

<!-- VERIFY: release dates and version numbers. This project has no tagged release yet; the section above is a draft. -->

## [0.1.0] — 2026-11-16

- Initial public checkpoint of the site and contributor documentation.

[unreleased]: https://github.com/hsay123/TeleVaultt/compare/main...HEAD
[0.1.0]: https://github.com/hsay123/TeleVaultt/releases/tag/v0.1.0
