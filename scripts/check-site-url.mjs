#!/usr/bin/env node
/**
 * Offline guard for the single SITE_URL source. Fails if any tracked file
 * still points at a legacy host, or if a page's canonical/social/manifest/
 * sitemap/robots metadata drifts from site.config.json.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const config = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const siteUrl = String(config.siteUrl || '').replace(/\/+$/, '');
const failures = [];
const read = (file) => readFileSync(join(ROOT, file), 'utf8');
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

if (!/^https?:\/\//.test(siteUrl)) failures.push('site.config.json: siteUrl is not an http(s) origin');

// 1. No legacy host may survive in any tracked text file.
const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
for (const file of tracked) {
  let content;
  try {
    content = readFileSync(join(ROOT, file), 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\0')) continue;
  if (/hsay123\.github\.io/i.test(content)) failures.push(`${file}: legacy github.io URL`);
}

// 2. Per-page metadata.
const pages = ['index.html', 'contribute.html', 'download.html', 'privacy.html', 'terms.html'];
for (const page of pages) {
  const html = read(page);
  const path = page === 'index.html' ? '/' : `/${page}`;
  expect(
    html.includes(`<link rel="canonical" href="${siteUrl}${path}" />`),
    `${page}: canonical does not match ${siteUrl}${path}`,
  );
  expect(
    html.includes(`property="og:url" content="${siteUrl}${path}"`),
    `${page}: og:url does not match ${siteUrl}${path}`,
  );
  expect(
    html.includes(`property="og:image" content="${siteUrl}/assets/img/og.jpg"`),
    `${page}: og:image is not an absolute ${siteUrl} URL`,
  );
  expect(
    html.includes(`name="twitter:image" content="${siteUrl}/assets/img/og.jpg"`),
    `${page}: twitter:image is not an absolute ${siteUrl} URL`,
  );
}

// 3. Structured data.
const home = read('index.html');
expect(home.includes(`"url": "${siteUrl}/"`), 'index.html: JSON-LD url is stale');
expect(
  home.includes(`"image": "${siteUrl}/assets/img/og.jpg"`),
  'index.html: JSON-LD image is not an absolute site URL',
);
expect(
  home.includes(`"downloadUrl": "${siteUrl}/download.html"`),
  'index.html: JSON-LD downloadUrl is stale',
);

// 4. Discovery files.
const sitemap = read('sitemap.xml');
for (const path of ['/', '/contribute.html', '/download.html', '/privacy.html', '/terms.html']) {
  expect(sitemap.includes(`<loc>${siteUrl}${path}</loc>`), `sitemap.xml: missing ${siteUrl}${path}`);
}
expect(read('robots.txt').includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'robots.txt: Sitemap line is stale');

const manifest = JSON.parse(read('site.webmanifest'));
expect(manifest.start_url === `${siteUrl}/`, 'site.webmanifest: start_url is stale');
expect(manifest.scope === `${siteUrl}/`, 'site.webmanifest: scope is stale');
expect(
  manifest.icons.every((icon) => icon.src.startsWith(`${siteUrl}/`)),
  'site.webmanifest: icon URLs are not absolute site URLs',
);

if (failures.length) {
  console.error(`check:site-url failed (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(`Fix with: npm run set-site-url -- ${siteUrl}`);
  process.exit(1);
}

console.log(`check:site-url: all references use ${siteUrl}`);
