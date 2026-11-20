#!/usr/bin/env node
/**
 * Switch download.html between its three states:
 *   npm run set-release -- none             no published installer yet
 *   npm run set-release -- v0.1.0-rc.1      a published tag (beta / RC)
 *   npm run set-release -- stable           the non-prerelease latest release
 *
 * A tag or "stable" must resolve to a published, non-draft GitHub release that
 * contains all six installers plus SHA256SUMS.txt. Nothing is written if a
 * check fails, so a failed run never leaves a dead link behind.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const APP_URL = 'https://github.com/hsay123/TGDrive';
const API = 'https://api.github.com/repos/hsay123/TGDrive';

const INSTALLERS = [
  'TeleVault-windows-x64.exe',
  'TeleVault-macos-arm64.dmg',
  'TeleVault-macos-x64.dmg',
  'TeleVault-linux-x64.AppImage',
  'TeleVault-linux-x64.deb',
  'TeleVault-linux-x64.rpm',
];
const EXPECTED_ASSETS = [...INSTALLERS, 'SHA256SUMS.txt'];
const TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SLOT_PATTERN =
  /<!-- dl-slot asset="([^"]+)" label="([^"]+)" -->\r?\n([ \t]*)[\s\S]*?\r?\n([ \t]*)<!-- \/dl-slot -->/g;

const arg = process.argv[2];
if (!arg || process.argv.length !== 3) {
  console.error('Usage: npm run set-release -- <none|vX.Y.Z[-suffix]|stable>');
  process.exit(1);
}
const mode = arg === 'none' || arg === 'stable' ? arg : 'tag';
if (mode === 'tag' && !TAG_PATTERN.test(arg)) {
  console.error(`Invalid tag "${arg}". Expected something like v0.1.0-rc.1.`);
  process.exit(1);
}

const stripV = (value) => String(value || '').replace(/^v/, '');
const versionOf = (value) => stripV(value) || '0.1.0';

async function fetchRelease() {
  if (mode === 'none') return null;

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'televault-website-set-release',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const path = mode === 'stable' ? '/releases/latest' : `/releases/tags/${arg}`;
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  }
  const release = await response.json();
  if (release.draft) throw new Error('the release is a draft, not published');
  if (mode === 'stable' && release.prerelease) {
    throw new Error('the latest release is a prerelease; "stable" requires a non-prerelease release');
  }

  const found = new Set((Array.isArray(release.assets) ? release.assets : []).map((asset) => asset.name));
  const missing = EXPECTED_ASSETS.filter((name) => !found.has(name));
  if (missing.length) {
    throw new Error(`the release is missing ${missing.join(', ')}`);
  }
  return release;
}

async function buildOutputs(release) {
  const htmlPath = join(ROOT, 'download.html');
  const scriptPath = join(ROOT, 'script.js');
  const html = readFileSync(htmlPath, 'utf8');
  const script = readFileSync(scriptPath, 'utf8');

  const tag = mode === 'tag' ? arg : release ? release.tag_name : '';
  const version = versionOf(tag);
  const assetUrl = (asset) =>
    mode === 'stable'
      ? `${APP_URL}/releases/latest/download/${asset}`
      : `${APP_URL}/releases/download/${tag}/${asset}`;

  const slots = [];
  let nextHtml = html.replace(
    /<html lang="en" data-release-state="[^"]+">/,
    `<html lang="en" data-release-state="${mode}">`,
  );

  nextHtml = nextHtml.replace(SLOT_PATTERN, (_full, asset, label, indent) => {
    slots.push(asset);
    const body =
      mode === 'none'
        ? `<span class="dl-soon">Coming soon</span>`
        : `<a class="dl-download" data-dl-asset="${asset}" href="${assetUrl(asset)}">${label}</a>`;
    return `<!-- dl-slot asset="${asset}" label="${label}" -->\n${indent}${body}\n${indent}<!-- /dl-slot -->`;
  });

  nextHtml = nextHtml.replace(
    /(<span class="dl-chip dl-chip--version" data-dl-version>)[^<]*(<\/span>)/,
    `$1v${version}$2`,
  );

  if (
    new Set(slots).size !== EXPECTED_ASSETS.length ||
    EXPECTED_ASSETS.some((asset) => !slots.includes(asset))
  ) {
    throw new Error(`download.html has unexpected download slots: ${slots.join(', ')}`);
  }
  if (!nextHtml.includes(`data-release-state="${mode}"`) || nextHtml.includes('href="#"')) {
    throw new Error('download.html could not be rewritten safely');
  }

  const replacements = [
    [/const RELEASE_TAG = '[^']*';/, `const RELEASE_TAG = '${mode === 'tag' ? tag : ''}';`],
    [/const BETA = (?:true|false);/, `const BETA = ${mode === 'stable' ? 'false' : 'true'};`],
    [/const APP_VERSION = '[^']*';/, `const APP_VERSION = '${version}';`],
  ];
  let nextScript = script;
  for (const [pattern, value] of replacements) {
    if (!pattern.test(nextScript)) throw new Error(`script.js does not contain ${pattern}`);
    nextScript = nextScript.replace(pattern, value);
  }

  // Keep the committed files Prettier-clean in every state, so a release
  // switch never fails the repository's format check. The CLI resolves
  // .prettierrc automatically; the API needs it passed explicitly.
  const htmlOptions = { ...(await prettier.resolveConfig(htmlPath)), filepath: htmlPath };
  const scriptOptions = { ...(await prettier.resolveConfig(scriptPath)), filepath: scriptPath };
  return [
    {
      path: htmlPath,
      name: 'download.html',
      content: await prettier.format(nextHtml, htmlOptions),
    },
    {
      path: scriptPath,
      name: 'script.js',
      content: await prettier.format(nextScript, scriptOptions),
    },
  ];
}

try {
  const release = await fetchRelease();
  const outputs = await buildOutputs(release);
  for (const output of outputs) writeFileSync(output.path, output.content);

  console.log(`Release state: ${mode}${release ? ` (${release.tag_name})` : ''}`);
  console.log('Changed files:');
  for (const output of outputs) console.log(`  - ${output.name}`);
  if (mode === 'none')
    console.log('No installer links are published. Static HTML shows the coming-soon state.');
  else console.log(`Assets: ${EXPECTED_ASSETS.join(', ')}`);
} catch (error) {
  console.error(`set-release failed: ${error.message}`);
  process.exit(1);
}
