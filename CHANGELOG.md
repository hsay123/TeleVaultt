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

### Fixed

- Restored a single `<main>` landmark by turning the hero wrapper into a `div`.
- Removed the Google Fonts request in favour of self-hosted files, eliminating a
  third-party render-blocking request.
- Removed the empty viewport of paper between the hero and the trust strip: the
  hero pin trigger is sized to the scaled 1728×1117 canvas instead of a fixed
  `200vh`, so the hero scrolls out exactly as the next section arrives.

<!-- VERIFY: release dates and version numbers. This project has no tagged release yet; the section above is a draft. -->

## [0.1.0] — 2026-11-16

- Initial public checkpoint of the site and contributor documentation.

[unreleased]: https://github.com/hsay123/TeleVaultt/compare/main...HEAD
[0.1.0]: https://github.com/hsay123/TeleVaultt/releases/tag/v0.1.0
