#!/usr/bin/env node
/**
 * Switch every committed site reference to a new origin in one command:
 *
 *   npm run set-site-url -- https://example.com
 *
 * `site.config.json` holds the single SITE_URL value. The script reads the
 * current value from there, rewrites the files that carry it (both plain and
 * percent-encoded forms), writes the new value back, then formats the touched
 * files so a domain change never fails CI's format check.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONFIG_PATH = join(ROOT, 'site.config.json');

// Every tracked file that can carry a site URL. Keep in sync with
// scripts/check-site-url.mjs.
const SITE_URL_FILES = [
  'index.html',
  'contribute.html',
  'download.html',
  'privacy.html',
  'terms.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  '.github/ISSUE_TEMPLATE/config.yml',
  'tests/links-and-tabs.spec.js',
];

const arg = process.argv[2];
if (!arg || process.argv.length !== 3) {
  console.error('Usage: npm run set-site-url -- <https://your-domain>');
  process.exit(1);
}

let nextUrl;
try {
  const parsed = new URL(arg);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error('expected an origin such as https://example.com');
  }
  nextUrl = parsed.origin;
} catch (error) {
  console.error(`Invalid site URL "${arg}": ${error.message}`);
  process.exit(1);
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

try {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const oldUrl = String(config.siteUrl || '').replace(/\/+$/, '');
  if (!oldUrl) throw new Error('site.config.json is missing siteUrl');

  const encodedOld = encodeURIComponent(oldUrl);
  const encodedNew = encodeURIComponent(nextUrl);
  const encodedPattern = new RegExp(escapeRegExp(encodedOld), 'gi');
  const oldHost = oldUrl.replace(/^https?:\/\//, '');
  const newHost = nextUrl.replace(/^https?:\/\//, '');
  // Bare hostnames appear in visible link text; the lookbehind leaves full
  // scheme URLs for the explicit replacements below.
  const hostPattern = new RegExp(`(?<!\\/)${escapeRegExp(oldHost)}`, 'g');
  const changed = [];

  for (const relative of SITE_URL_FILES) {
    const path = join(ROOT, relative);
    const original = readFileSync(path, 'utf8');
    let content = original;
    if (oldHost !== newHost) content = content.replace(hostPattern, newHost);
    content = content.split(oldUrl).join(nextUrl);
    if (encodedOld !== encodedNew) content = content.replace(encodedPattern, encodedNew);
    if (content === original) continue;
    writeFileSync(path, content);
    changed.push(relative);
  }

  if (nextUrl !== oldUrl) {
    writeFileSync(CONFIG_PATH, `${JSON.stringify({ ...config, siteUrl: nextUrl }, null, 2)}\n`);
    changed.push('site.config.json');
  }

  // The CLI resolves .prettierrc automatically; the API needs it passed
  // explicitly. Skip files Prettier has no parser for (e.g. robots.txt,
  // sitemap.xml) and files excluded by .prettierignore.
  for (const relative of changed) {
    const path = join(ROOT, relative);
    const info = await prettier.getFileInfo(path, { ignorePath: join(ROOT, '.prettierignore') });
    if (info.ignored || !info.inferredParser) continue;
    const content = readFileSync(path, 'utf8');
    const options = { ...(await prettier.resolveConfig(path)), filepath: path };
    writeFileSync(path, await prettier.format(content, options));
  }

  console.log(`Site URL: ${oldUrl} -> ${nextUrl}`);
  console.log(`Changed files (${changed.length}):`);
  for (const relative of changed) console.log(`  - ${relative}`);
  if (changed.length === 0) console.log('  (all references already used the new URL)');
  console.log('Run `npm run check:site-url` to verify every reference.');
} catch (error) {
  console.error(`set-site-url failed: ${error.message}`);
  process.exit(1);
}
