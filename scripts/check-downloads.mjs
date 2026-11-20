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
const INSTALLERS = [
  'TeleVault-windows-x64.exe',
  'TeleVault-macos-arm64.dmg',
  'TeleVault-macos-x64.dmg',
  'TeleVault-linux-x64.AppImage',
  'TeleVault-linux-x64.deb',
  'TeleVault-linux-x64.rpm',
];
const ALL_ASSETS = [...INSTALLERS, 'SHA256SUMS.txt'];
const online = process.argv.includes('--online');

const html = readFileSync(join(ROOT, 'download.html'), 'utf8');
const script = readFileSync(join(ROOT, 'script.js'), 'utf8');

const errors = [];
const fail = (message) => errors.push(message);

const state = html.match(/<html[^>]*data-release-state="([^"]+)"/)?.[1] ?? null;
const tag = script.match(/const RELEASE_TAG = '([^']*)'/)?.[1] ?? null;
const beta = /const BETA = true;/.test(script);
const assetLinks = [...html.matchAll(/data-dl-asset="([^"]+)"\s+href="([^"]+)"/g)].map((match) => ({
  asset: match[1],
  href: match[2],
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
  } else if (!beta) {
    fail('script.js: tag state needs BETA = true');
  }

  if (!assetLinks.length) fail('download.html: published state has no download links');
  for (const { asset, href } of assetLinks) {
    if (!ALL_ASSETS.includes(asset)) fail(`download.html: unexpected download asset "${asset}"`);
    if (!href.startsWith(expectedPrefix + asset)) {
      fail(`download.html: bad URL for ${asset}: ${href}`);
    }
  }
  const linked = new Set(assetLinks.map((link) => link.asset));
  for (const asset of ALL_ASSETS) {
    if (!linked.has(asset)) fail(`download.html: missing download link for ${asset}`);
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
