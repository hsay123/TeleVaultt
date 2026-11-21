#!/usr/bin/env node
/**
 * Download-page guard.
 *
 * Offline (default, part of `npm run check`): verify that the static HTML and
 * the release config agree, that the "none" state has no download links, and
 * that a published state links only to approved GitHub release assets.
 *
 * Online (`npm run check:downloads:online`): HEAD every published asset URL
 * and require a 200 after redirects. Used by the weekly workflow.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const APP_URL = 'https://github.com/hsay123/TGDrive';
const EXPECTED_ASSETS = [
  'TeleVault-windows-x64.exe',
  'TeleVault-macos-arm64.dmg',
  'TeleVault-macos-x64.dmg',
  'TeleVault-linux-x64.AppImage',
  'TeleVault-linux-x64.deb',
  'TeleVault-linux-x64.rpm',
  'SHA256SUMS.txt',
];
const online = process.argv.includes('--online');

const html = readFileSync(join(ROOT, 'download.html'), 'utf8');
const script = readFileSync(join(ROOT, 'script.js'), 'utf8');

const errors = [];
const fail = (message) => errors.push(message);

const state = html.match(/<html[^>]*data-release-state="([^"]+)"/)?.[1] ?? null;
const tag = script.match(/const RELEASE_TAG = '([^']*)'/)?.[1] ?? null;
const beta = /const BETA = true;/.test(script);
const versionChip =
  html.match(/<span class="dl-chip dl-chip--version" data-dl-version>([^<]*)<\/span>/)?.[1] ?? null;

// script.js owns the asset map; this guard makes sure the HTML cannot drift
// away from it and that no unexpected file is ever linked as a download.
const assetsBlock = script.match(/const RELEASE_ASSETS = \{([\s\S]*?)\};/)?.[1] ?? '';
const ASSETS = [...assetsBlock.matchAll(/^\s*(?:'([^']+)'|[A-Za-z0-9_-]+):\s*'([^']+)'\s*,?/gm)].map(
  (match) => match[2],
);

if (!ASSETS.length) {
  fail('script.js: could not read the RELEASE_ASSETS map');
} else if (
  ASSETS.length !== EXPECTED_ASSETS.length ||
  EXPECTED_ASSETS.some((asset) => !ASSETS.includes(asset))
) {
  fail(`script.js: RELEASE_ASSETS must be exactly ${EXPECTED_ASSETS.join(', ')}; found ${ASSETS.join(', ')}`);
}
if (!/const SIGNED = \{\s*windows:\s*false,\s*macos:\s*false\s*\};/.test(script)) {
  fail('script.js: SIGNED must be { windows: false, macos: false }');
}

const assetLinks = [...html.matchAll(/<a\b[^>]*\bdata-dl-asset="([^"]+)"[^>]*>/g)].map((match) => ({
  asset: match[1],
  href: match[0].match(/\bhref="([^"]+)"/)?.[1] ?? null,
}));

if (!['none', 'tag', 'stable'].includes(state)) {
  fail(`download.html: unknown data-release-state "${state}"`);
} else if (state === 'none') {
  if (tag !== '') fail(`script.js: RELEASE_TAG must be "" in the none state, found "${tag}"`);
  if (!beta) fail('script.js: BETA must be true in the none state');
  if (assetLinks.length) fail(`download.html: none state has ${assetLinks.length} download link(s)`);
  if (/releases\/(?:download|latest\/download)\//.test(html)) {
    fail('download.html: none state contains a release download URL');
  }
  if (!html.includes('TeleVault beta installers are coming soon')) {
    fail('download.html: none state is missing the coming-soon message');
  }
  if (!html.includes(`${APP_URL}/releases`)) {
    fail('download.html: none state is missing the Watch releases link');
  }
  if (!html.includes(`${APP_URL}/blob/main/televault/docs/SETUP.md`)) {
    fail('download.html: none state is missing the Build from source link');
  }
} else {
  const expectedPrefix =
    state === 'stable' ? `${APP_URL}/releases/latest/download/` : `${APP_URL}/releases/download/${tag}/`;

  if (state === 'tag' && !tag) fail('script.js: tag state needs a RELEASE_TAG');
  if (state === 'stable') {
    if (tag !== '') fail(`script.js: stable state needs RELEASE_TAG = "", found "${tag}"`);
    if (beta) fail('script.js: stable state needs BETA = false');
    if (/pre-release/.test(versionChip ?? '')) {
      fail(`download.html: stable version chip must not say pre-release: "${versionChip}"`);
    }
  } else {
    if (!beta) fail('script.js: tag state needs BETA = true');
    if (!versionChip?.includes('pre-release')) {
      fail(`download.html: tag version chip must say ", pre-release": "${versionChip}"`);
    }
  }

  if (!assetLinks.length) fail('download.html: published state has no download links');
  for (const { asset, href } of assetLinks) {
    if (!ASSETS.includes(asset)) fail(`download.html: asset "${asset}" is not in the RELEASE_ASSETS map`);
    if (!href || !href.startsWith(expectedPrefix + asset)) {
      fail(`download.html: bad URL for ${asset}: ${href}`);
    }
  }
  const linked = new Set(assetLinks.map((link) => link.asset));
  for (const asset of ASSETS) {
    if (!linked.has(asset)) fail(`download.html: missing download link for ${asset}`);
  }
  const knownHrefs = new Set(assetLinks.map((link) => link.href));
  for (const [, href] of html.matchAll(
    /href="(https:\/\/github\.com\/hsay123\/TGDrive\/releases\/[^"]+)"/g,
  )) {
    if (!knownHrefs.has(href) && href !== `${APP_URL}/releases`) {
      fail(`download.html: release URL is not tied to a mapped asset: ${href}`);
    }
  }
}

if (/href="#"/.test(html)) fail('download.html: dead href="#" found');
if (/href="https:\/\/github\.com\/hsay123\/TGDrive">Download</.test(html)) {
  fail('download.html: Download link still points at the repository root');
}

console.log(`Download state: ${state ?? 'unknown'}`);
if (assetLinks.length)
  console.log(
    `  ${assetLinks.length} asset links, ${new Set(assetLinks.map((l) => l.href)).size} unique URLs`,
  );

if (errors.length) {
  console.error(`\n${errors.length} download problem(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (!online || state === 'none') {
  if (online) console.log('\nNo published assets to check online.');
  else console.log('\nOffline download checks OK.');
  process.exit(0);
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers = { 'User-Agent': 'televault-website-download-check' };
if (token) headers.Authorization = `Bearer ${token}`;

const urls = [...new Set(assetLinks.map((link) => link.href))];
const failures = [];
for (const url of urls) {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', headers });
    if (response.status !== 200) failures.push(`${url} → HTTP ${response.status}`);
    else console.log(`  200  ${url}`);
  } catch (error) {
    failures.push(`${url} → ${error.message}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} online download check failure(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`\nAll ${urls.length} asset URLs returned 200.`);
