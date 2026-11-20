import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const APP = 'https://github.com/hsay123/TGDrive';
const TAG = 'v0.1.0-rc.1';
const PREFIX = `${APP}/releases/download/${TAG}/`;
const ASSETS = [
  'TeleVault-windows-x64.exe',
  'TeleVault-macos-arm64.dmg',
  'TeleVault-macos-x64.dmg',
  'TeleVault-linux-x64.AppImage',
  'TeleVault-linux-x64.deb',
  'TeleVault-linux-x64.rpm',
  'SHA256SUMS.txt',
];

const UA = {
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  macos:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  linux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};

const htmlSource = readFileSync(fileURLToPath(new URL('../download.html', import.meta.url)), 'utf8');
const scriptSource = readFileSync(fileURLToPath(new URL('../script.js', import.meta.url)), 'utf8');

function setReleaseFixtures() {
  const html = htmlSource
    .replace(/<html lang="en" data-release-state="[^"]+">/, '<html lang="en" data-release-state="tag">')
    .replace(/(<span class="dl-chip dl-chip--version" data-dl-version>)[^<]*(<\/span>)/, `$1${TAG}$2`)
    .replace(
      /<!-- dl-slot asset="([^"]+)" label="([^"]+)" -->[\s\S]*?<!-- \/dl-slot -->/g,
      (_full, asset, label) =>
        `<!-- dl-slot asset="${asset}" label="${label}" -->\n                <a class="dl-download" data-dl-asset="${asset}" href="${PREFIX}${asset}">${label}</a>\n                <!-- /dl-slot -->`,
    );
  const script = scriptSource.replace(/const RELEASE_TAG = '[^']*';/, `const RELEASE_TAG = '${TAG}';`);
  return { html, script };
}

async function serveSetRelease(page) {
  const { html, script } = setReleaseFixtures();
  await page.route('**/download.html', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  );
  await page.route('**/script.js', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: script }),
  );
}

const mockRelease = {
  tag_name: TAG,
  assets: ASSETS.map((name) => ({ name, size: 137 * 1024 * 1024 })),
};

test('homepage "Get TeleVault" lands on the download page', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.hero__cta[data-download]').click();
  await expect(page).toHaveURL(/\/download\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Download TeleVault.');
});

test.describe('none state (current repository state)', () => {
  test('shows coming soon with no download links or dead hrefs', async ({ page }) => {
    await page.goto('/download.html');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Download TeleVault.');
    await expect(page.locator('.dl-hero__status')).toContainText([
      'TeleVault beta installers are coming soon',
    ]);
    await expect(page.locator('[data-dl-asset]')).toHaveCount(0);
    await expect(page.locator('a[href="#"]')).toHaveCount(0);

    await expect(page.getByRole('link', { name: 'Watch releases on GitHub' })).toHaveAttribute(
      'href',
      `${APP}/releases`,
    );
    await expect(page.getByRole('link', { name: 'Build from source' })).toHaveAttribute(
      'href',
      `${APP}/blob/main/televault/docs/SETUP.md`,
    );
    await expect(page.locator('.dl-hero__links .dl-hint')).toContainText('Watch → Custom → Releases');
  });

  test('highlights the card detected from the user agent', async ({ browser }) => {
    const cases = [
      [UA.windows, 'windows', 'Windows'],
      [UA.macos, 'macos', 'macOS'],
      [UA.linux, 'linux', 'Linux'],
    ];
    for (const [userAgent, card, label] of cases) {
      const context = await browser.newContext({ userAgent });
      const page = await context.newPage();
      await page.goto('/download.html');

      await expect(page.locator(`[data-dl-card="${card}"]`)).toHaveClass(/is-highlighted/);
      await expect(page.locator('[data-dl-os-title]')).toHaveText(`Download for ${label}`);
      await expect(page.locator('[data-dl-os-suffix]')).toHaveText(` for ${label}`);
      await context.close();
    }
  });

  test('does not highlight a card on mobile user agents', async ({ browser }) => {
    for (const userAgent of [UA.android, UA.ios]) {
      const context = await browser.newContext({ userAgent });
      const page = await context.newPage();
      await page.goto('/download.html');

      await expect(page.locator('[data-dl-card].is-highlighted')).toHaveCount(0);
      await expect(page.locator('[data-dl-os-title]')).toHaveText('Download for your system');
      await context.close();
    }
  });

  test('uses client hints when they are available', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgentData', {
        configurable: true,
        value: {
          platform: 'macOS',
          getHighEntropyValues: async () => ({ platform: 'macOS', architecture: 'arm' }),
        },
      });
    });
    await page.goto('/download.html');
    await expect(page.locator('[data-dl-card="macos"]')).toHaveClass(/is-highlighted/);
  });

  test('tabs work by click, keyboard and URL hash', async ({ page }) => {
    await page.goto('/download.html');

    const windowsTab = page.locator('[data-dl-tab="windows"]');
    const macTab = page.locator('[data-dl-tab="macos"]');
    const linuxTab = page.locator('[data-dl-tab="linux"]');

    await expect(windowsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-dl-panel="windows"]')).toBeVisible();

    await macTab.click();
    await expect(macTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-dl-panel="macos"]')).toBeVisible();
    await expect(page).toHaveURL(/#macos$/);

    await macTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(linuxTab).toBeFocused();
    await expect(linuxTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-dl-panel="linux"]')).toBeVisible();

    await page.keyboard.press('Home');
    await expect(windowsTab).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(linuxTab).toHaveAttribute('aria-selected', 'true');

    await page.goto('/download.html#macos');
    await expect(page.locator('[data-dl-panel="macos"]')).toBeVisible();
    await expect(page.locator('[data-dl-panel="windows"]')).toBeHidden();
  });

  test('reduced motion keeps the page visible and disables transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/download.html');
    await expect(page.locator('.dl-hero__card')).toBeVisible();
    const duration = await page
      .locator('.dl-card')
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.001);
  });
});

test.describe('published state', () => {
  test('static HTML contains real installer hrefs without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await serveSetRelease(page);
    await page.goto('/download.html');

    const hrefs = await page
      .locator('[data-dl-asset]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect([...new Set(hrefs)].sort()).toEqual([...new Set(ASSETS.map((asset) => PREFIX + asset))].sort());
    await context.close();
  });

  test('shows a toast on click without starting a download', async ({ page }) => {
    await serveSetRelease(page);
    await page.goto('/download.html');
    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (event) => {
          if (event.target.closest('[data-dl-asset]')) event.preventDefault();
        },
        true,
      );
    });

    await page.locator('[data-dl-card="windows"] [data-dl-asset]').click();
    await expect(page.locator('[data-dl-toast]')).toBeVisible();
    await expect(page.locator('[data-dl-toast]')).toContainText('Downloading TeleVault v0.1.0-rc.1…');
  });

  test('Apple Silicon / Intel toggle switches the visible macOS build', async ({ browser }) => {
    const context = await browser.newContext({ userAgent: UA.macos });
    const page = await context.newPage();
    await serveSetRelease(page);
    await page.goto('/download.html');

    const armPanel = page.locator('[data-dl-mac-panel="arm64"]');
    const intelPanel = page.locator('[data-dl-mac-panel="x64"]');
    const armLink = armPanel.locator('[data-dl-asset]');
    const intelLink = intelPanel.locator('[data-dl-asset]');

    await expect(armPanel).toBeVisible();
    await expect(intelPanel).toBeHidden();
    await expect(armLink).toHaveAttribute('href', `${PREFIX}TeleVault-macos-arm64.dmg`);

    await page.locator('[data-dl-mac-toggle="x64"]').click();
    await expect(armPanel).toBeHidden();
    await expect(intelPanel).toBeVisible();
    await expect(intelLink).toHaveAttribute('href', `${PREFIX}TeleVault-macos-x64.dmg`);
    await expect(page.locator('.dl-hero__actions [data-dl-asset]')).toHaveAttribute(
      'href',
      `${PREFIX}TeleVault-macos-x64.dmg`,
    );
    await expect(page.locator('[data-dl-mac-toggle="x64"]')).toHaveAttribute('aria-pressed', 'true');
    await context.close();
  });

  test('fills version and size chips from a successful API response', async ({ page }) => {
    await serveSetRelease(page);
    await page.route('https://api.github.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRelease) }),
    );
    await page.goto('/download.html');

    await expect(page.locator('[data-dl-version]')).toHaveText('v0.1.0-rc.1');
    await expect(page.locator('[data-dl-size]')).toBeVisible();
    await expect(page.locator('[data-dl-size]')).toHaveText('137 MB');
    await expect(page.locator('[data-dl-size-for="TeleVault-windows-x64.exe"]')).toHaveText('137 MB');
  });

  for (const [label, status] of [
    ['API failure', 500],
    ['rate limit', 403],
  ]) {
    test(`hides dynamic chips on ${label}`, async ({ page }) => {
      await serveSetRelease(page);
      await page.route('https://api.github.com/**', (route) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          headers: status === 403 ? { 'x-ratelimit-remaining': '0' } : {},
          body: JSON.stringify({ message: 'unavailable' }),
        }),
      );
      await page.goto('/download.html');

      await expect(page.locator('[data-dl-size]')).toBeHidden();
      await expect(page.locator('[data-dl-version]')).toHaveText(TAG);
      await expect(page.locator('[data-dl-card="windows"] [data-dl-asset]')).toBeVisible();
    });
  }
});

test('copy link and email link work on the mobile note', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/download.html');
  await page.locator('[data-dl-copy-link]').click();
  await expect(page.locator('[data-dl-copy-link] span')).toHaveText('Copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('/download.html');
  await expect(page.locator('[data-dl-email-link]')).toHaveAttribute(
    'href',
    /^mailto:\?subject=TeleVault%20download&body=/,
  );
});
