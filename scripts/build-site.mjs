// Assemble the files the site actually serves into public/ for Vercel.
// Keeping this explicit means repository scaffolding (docs, workflows, tests,
// package manifests) is never uploaded to the public deployment.
import { cp, mkdir, rm } from 'node:fs/promises';

const entries = [
  'index.html',
  'contribute.html',
  'download.html',
  'privacy.html',
  'terms.html',
  '404.html',
  'styles.css',
  'script.js',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'assets',
];

await rm('public', { recursive: true, force: true });
await mkdir('public', { recursive: true });

for (const entry of entries) {
  await cp(entry, `public/${entry}`, { recursive: true });
}

console.log(`Assembled public/ from ${entries.length} entries.`);
