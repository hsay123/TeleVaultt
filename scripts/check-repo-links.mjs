#!/usr/bin/env node
/**
 * Repo-link guard.
 *
 * TeleVault has two repositories: the desktop app (`hsay123/TGDrive`) and this
 * website (`hsay123/TeleVaultt`). Product links must point at the app; only
 * website, docs and design links may point here.
 *
 * Fails when:
 *   - a github.com/hsay123 URL uses any repo other than TGDrive or TeleVaultt;
 *   - the old CONFIG keys REPO_URL / APP_REPO_URL (or CONFIG.REPO) survive;
 *   - a website URL appears in the header, hero, footer GitHub links or the
 *     Contribute section of index.html;
 *   - contribute.html's top-right GitHub link, repo picker or setup tabs point
 *     at the wrong repository;
 *   - script.js's APP_* and WEB_* constants are swapped or missing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const APP = 'TGDrive';
const WEB = 'TeleVaultt';
const ALLOWED = new Set([APP, WEB]);
const SCAN_EXT = new Set(['.html', '.js', '.mjs', '.md', '.yml', '.yaml', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'assets', 'release', 'dist', 'public']);
const SELF = 'scripts/check-repo-links.mjs';

const errors = [];
const fail = (message) => errors.push(message);

/* -------------------------------------------------------------------------- */
/* Collect files                                                              */
/* -------------------------------------------------------------------------- */

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...walk(join(dir, entry.name)));
    } else if (SCAN_EXT.has(extname(entry.name))) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const files = walk(ROOT)
  .map((file) => relative(ROOT, file).split('\\').join('/'))
  .filter((file) => file !== SELF && file !== 'package-lock.json')
  .sort();

/* -------------------------------------------------------------------------- */
/* Repository slugs                                                           */
/* -------------------------------------------------------------------------- */

const URL_PATTERN = /https?:\/\/github\.com\/hsay123\/([A-Za-z0-9_.-]+)/g;
const SLUG_PATTERN = /(?<![/.\w])hsay123\/([A-Za-z0-9_.-]+)/g;

const clean = (repo) => repo.replace(/\.git$/, '');

function reposIn(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => clean(match[1]));
}

function repoFromHref(href) {
  const match = href.match(/github\.com\/hsay123\/([A-Za-z0-9_.-]+)/);
  return match ? clean(match[1]) : null;
}

/* -------------------------------------------------------------------------- */
/* Scan                                                                       */
/* -------------------------------------------------------------------------- */

const contents = new Map();
const counts = new Map();
const OLD_KEY = /\b(?:APP_)?REPO_URL\b|\bCONFIG\.REPO\b/;

for (const file of files) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  contents.set(file, text);

  const urls = reposIn(text, URL_PATTERN);
  const bare = reposIn(text, SLUG_PATTERN);

  counts.set(file, {
    app: urls.filter((repo) => repo === APP).length,
    web: urls.filter((repo) => repo === WEB).length,
  });

  for (const repo of [...urls, ...bare]) {
    if (!ALLOWED.has(repo)) {
      fail(`${file}: unknown repository slug "hsay123/${repo}" (expected ${APP} or ${WEB})`);
    }
  }

  if (OLD_KEY.test(text)) {
    fail(`${file}: old CONFIG key found (REPO_URL / APP_REPO_URL / CONFIG.REPO)`);
  }
}

/* -------------------------------------------------------------------------- */
/* Region helpers                                                             */
/* -------------------------------------------------------------------------- */

const ANCHOR_PATTERN = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

function anchors(html) {
  return [...html.matchAll(ANCHOR_PATTERN)].map((match) => ({
    href: match[1],
    text: match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }));
}

function region(html, start, end) {
  const from = html.indexOf(start);
  if (from === -1) return null;
  const to = html.indexOf(end, from + start.length);
  if (to === -1) return null;
  return html.slice(from, to + end.length);
}

function assertAppLinks(file, label, html, exceptions = []) {
  if (html === null) {
    fail(`${file}: could not find ${label}`);
    return;
  }
  for (const anchor of anchors(html)) {
    if (!anchor.href.includes('github.com/hsay123/')) continue;
    if (exceptions.includes(anchor.text)) continue;
    const repo = repoFromHref(anchor.href);
    if (repo !== APP) {
      fail(`${file}: ${label} link "${anchor.text}" points at ${repo ?? 'unknown'}, expected ${APP}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* index.html                                                                 */
/* -------------------------------------------------------------------------- */

const index = contents.get('index.html');
if (!index) {
  fail('index.html: file not found');
} else {
  assertAppLinks('index.html', 'header', region(index, '<header class="site-header"', '</header>'));
  assertAppLinks('index.html', 'menu panel', region(index, 'id="menuPanel"', 'class="hero-pin"'));
  assertAppLinks('index.html', 'hero', region(index, '<div class="hero" id="hero">', '<main id="main">'));
  assertAppLinks('index.html', 'Contribute section', region(index, 'id="contribute"', '<!-- 3.8 FAQ -->'));
  assertAppLinks('index.html', 'footer', region(index, '<footer class="footer">', '</footer>'), [
    'Website source',
    'Code of Conduct',
    'Security policy',
    'License',
  ]);
}

/* -------------------------------------------------------------------------- */
/* contribute.html                                                            */
/* -------------------------------------------------------------------------- */

const contribute = contents.get('contribute.html');
if (!contribute) {
  fail('contribute.html: file not found');
} else {
  assertAppLinks(
    'contribute.html',
    'top-right GitHub link',
    region(contribute, '<header class="doc-header"', '</header>'),
  );

  const picker = region(contribute, 'class="repo-picker"', '</div>\n              </div>');
  if (picker === null) {
    fail('contribute.html: could not find the "Which repo?" picker');
  } else {
    if (!picker.includes(`github.com/hsay123/${APP}/issues`)) {
      fail(`contribute.html: "Which repo?" picker has no ${APP} issues link`);
    }
    if (!picker.includes(`github.com/hsay123/${WEB}/issues`)) {
      fail(`contribute.html: "Which repo?" picker has no ${WEB} issues link`);
    }
  }

  const appPanel = region(contribute, 'data-setup-panel="app"', 'data-setup-panel="website"');
  const webPanel = region(contribute, 'data-setup-panel="website"', '</section>');

  if (appPanel === null) {
    fail('contribute.html: could not find the app setup panel');
  } else {
    if (!appPanel.includes(`github.com/hsay123/${APP}.git`)) {
      fail(`contribute.html: app setup panel does not clone ${APP}`);
    }
    if (appPanel.includes(`github.com/hsay123/${WEB}.git`)) {
      fail(`contribute.html: app setup panel clones ${WEB}`);
    }
  }

  if (webPanel === null) {
    fail('contribute.html: could not find the website setup panel');
  } else if (!webPanel.includes(`github.com/hsay123/${WEB}.git`)) {
    fail(`contribute.html: website setup panel does not clone ${WEB}`);
  }

  assertAppLinks('contribute.html', 'footer', region(contribute, '<footer class="footer">', '</footer>'), [
    'Website source',
    'Code of Conduct',
    'Security policy',
    'License',
  ]);
}

/* -------------------------------------------------------------------------- */
/* script.js CONFIG                                                           */
/* -------------------------------------------------------------------------- */

const script = contents.get('script.js');
if (!script) {
  fail('script.js: file not found');
} else {
  const expected = [
    ['APP_REPO', APP],
    ['APP_URL', APP],
    ['WEB_REPO', WEB],
    ['WEB_URL', WEB],
    ['DOWNLOAD_URL', APP],
  ];

  for (const [key, repo] of expected) {
    const match = script.match(new RegExp(`${key}:\\s*'([^']+)'`));
    if (!match) {
      fail(`script.js: CONFIG.${key} is missing`);
      continue;
    }
    const actual = match[1].split('/').filter(Boolean).pop();
    if (actual !== repo) {
      fail(`script.js: CONFIG.${key} points at ${actual}, expected ${repo}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

const rows = [...counts.entries()].filter(([, count]) => count.app + count.web > 0);
const width = Math.max(24, ...rows.map(([file]) => file.length));

console.log('Repository link counts (github.com/hsay123):');
console.log(`  ${'file'.padEnd(width)}  APP  WEB`);
for (const [file, count] of rows) {
  console.log(`  ${file.padEnd(width)}  ${String(count.app).padStart(3)}  ${String(count.web).padStart(3)}`);
}

if (errors.length) {
  console.error(`\n${errors.length} repo-link problem(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('\nRepo links OK.');
