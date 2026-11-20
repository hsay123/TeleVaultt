import { test, expect } from '@playwright/test';

const APP = 'https://github.com/hsay123/TGDrive';
const WEB = 'https://github.com/hsay123/TeleVaultt';
const DOWNLOAD_PAGE = 'https://televault-silk.vercel.app/download.html';

const githubAnchors = (page) =>
  page.locator('a[href*="github.com/hsay123"]').evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute('href'),
      text: link.textContent.replace(/\s+/g, ' ').trim(),
    })),
  );

test.describe('repository link mapping', () => {
  test('product links point at TGDrive and docs links at TeleVaultt', async ({ page }) => {
    await page.goto('/index.html');

    await expect(page.locator('.header__cta[data-download]')).toHaveAttribute('href', 'download.html');
    await expect(page.locator('.hero__cta[data-download]')).toHaveAttribute('href', 'download.html');
    await expect(page.locator('.hero .cta__alt')).toHaveAttribute('href', APP);
    await expect(page.locator('.hero .cta__alt')).toHaveText(/view on github/i);
    await expect(page.locator('.menu-panel__gh')).toHaveAttribute('href', APP);
    await expect(page.locator('.menu-panel__cta')).toHaveAttribute('href', 'download.html');
    await expect(page.locator('.footer').getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      'download.html',
    );

    const footer = page.locator('.footer');
    await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', APP);
    await expect(footer.getByRole('link', { name: 'Issues', exact: true })).toHaveAttribute(
      'href',
      `${APP}/issues`,
    );
    await expect(footer.getByRole('link', { name: 'Website source' })).toHaveAttribute('href', WEB);
    await expect(footer.getByRole('link', { name: 'Code of Conduct' })).toHaveAttribute(
      'href',
      `${WEB}/blob/main/CODE_OF_CONDUCT.md`,
    );

    const anchors = await githubAnchors(page);
    expect(anchors.some((a) => /discussions/i.test(a.href))).toBe(false);
    expect(anchors.filter((a) => a.href.startsWith(APP) && /[?&]template=/.test(a.href))).toEqual([]);

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd)).toMatchObject({ downloadUrl: DOWNLOAD_PAGE, codeRepository: APP });
  });

  test('contribute guide separates app and website work', async ({ page }) => {
    await page.goto('/contribute.html');

    await expect(page.locator('.doc-header__nav a[aria-label="TeleVault on GitHub"]')).toHaveAttribute(
      'href',
      APP,
    );

    const picker = page.locator('.repo-picker');
    await expect(picker.getByRole('link', { name: 'Open TGDrive issues' })).toHaveAttribute(
      'href',
      `${APP}/issues`,
    );
    await expect(picker.getByRole('link', { name: 'Open TeleVaultt issues' })).toHaveAttribute(
      'href',
      `${WEB}/issues`,
    );
    await expect(picker).toContainText('repository name');

    const appPanel = page.locator('[data-setup-panel="app"]');
    await expect(appPanel).toContainText('git clone https://github.com/hsay123/TGDrive.git');
    await expect(appPanel).toContainText('cd TGDrive/televault');
    await expect(appPanel).not.toContainText('TeleVaultt.git');

    const anchors = await githubAnchors(page);
    expect(anchors.some((a) => /discussions/i.test(a.href))).toBe(false);
    expect(anchors.filter((a) => a.href.startsWith(APP) && /[?&]template=/.test(a.href))).toEqual([]);
  });

  test('404 bug report stays on the website repository', async ({ page }) => {
    await page.goto('/404.html');
    const anchors = await githubAnchors(page);
    expect(anchors.length).toBeGreaterThan(0);
    expect(anchors.every((a) => a.href.startsWith(WEB))).toBe(true);
  });
});

test.describe('setup tabs', () => {
  test('mouse click switches panels', async ({ page }) => {
    await page.goto('/contribute.html');

    const appTab = page.locator('[data-setup-tab="app"]');
    const webTab = page.locator('[data-setup-tab="website"]');
    const appPanel = page.locator('[data-setup-panel="app"]');
    const webPanel = page.locator('[data-setup-panel="website"]');

    await expect(appTab).toHaveAttribute('aria-selected', 'true');
    await expect(appPanel).toBeVisible();
    await expect(webPanel).toBeHidden();

    await webTab.click();
    await expect(webTab).toHaveAttribute('aria-selected', 'true');
    await expect(appPanel).toBeHidden();
    await expect(webPanel).toBeVisible();
    await expect(webPanel).toContainText('git clone https://github.com/hsay123/TeleVaultt.git');
    await expect(page).toHaveURL(/#setup-website$/);

    await appTab.click();
    await expect(appTab).toHaveAttribute('aria-selected', 'true');
    await expect(webPanel).toBeHidden();
  });

  test('keyboard arrows, Home and End move selection', async ({ page }) => {
    await page.goto('/contribute.html');

    const appTab = page.locator('[data-setup-tab="app"]');
    const webTab = page.locator('[data-setup-tab="website"]');
    const appPanel = page.locator('[data-setup-panel="app"]');
    const webPanel = page.locator('[data-setup-panel="website"]');

    await appTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(webTab).toHaveAttribute('aria-selected', 'true');
    await expect(webTab).toBeFocused();
    await expect(webPanel).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(appTab).toHaveAttribute('aria-selected', 'true');
    await expect(appTab).toBeFocused();
    await expect(appPanel).toBeVisible();

    await page.keyboard.press('End');
    await expect(webTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expect(appTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(webTab).toHaveAttribute('aria-selected', 'true');
  });

  test('deep links open the matching panel', async ({ page }) => {
    await page.goto('/contribute.html#setup-website');
    await expect(page.locator('[data-setup-panel="website"]')).toBeVisible();
    await expect(page.locator('[data-setup-panel="app"]')).toBeHidden();

    await page.evaluate(() => {
      window.location.hash = '#setup-app';
    });
    await expect(page.locator('[data-setup-panel="app"]')).toBeVisible();
    await expect(page.locator('[data-setup-panel="website"]')).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('product links and app setup work from static HTML', async ({ page }) => {
    await page.goto('/index.html');

    await expect(page.locator('.header__cta[data-download]')).toHaveAttribute('href', 'download.html');
    await expect(page.locator('.hero__cta[data-download]')).toHaveAttribute('href', 'download.html');
    await expect(page.locator('.hero .cta__alt')).toHaveAttribute('href', APP);
    await expect(page.locator('.footer').getByRole('link', { name: 'Website source' })).toHaveAttribute(
      'href',
      WEB,
    );
    await expect(page.locator('[data-typing]')).toContainText(
      'git clone https://github.com/hsay123/TGDrive.git',
    );
    await expect(page.locator('[data-typing]')).toContainText('cd TGDrive/televault');

    await page.goto('/contribute.html');

    await expect(page.locator('.doc-header__nav a[aria-label="TeleVault on GitHub"]')).toHaveAttribute(
      'href',
      APP,
    );
    await expect(page.locator('[data-setup-panel="app"]')).toBeVisible();
    await expect(page.locator('[data-setup-panel="website"]')).toBeHidden();
    await expect(page.locator('[data-setup-panel="app"]')).toContainText(
      'git clone https://github.com/hsay123/TGDrive.git',
    );
    await expect(page.locator('noscript a')).toHaveAttribute(
      'href',
      `${WEB}/blob/main/CONTRIBUTING.md#set-up-locally`,
    );
  });
});

test.describe('GitHub data states', () => {
  test('empty issue list shows the empty state', async ({ page }) => {
    await page.route('https://api.github.com/**', (route) => {
      const url = route.request().url();
      const body = url.includes('/issues')
        ? []
        : url.includes('/contributors')
          ? []
          : {
              stargazers_count: 0,
              forks_count: 0,
              open_issues_count: 0,
              html_url: APP,
            };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await page.goto('/index.html');
    await page.locator('[data-github-panel]').scrollIntoViewIfNeeded();

    const empty = page.locator('[data-issues-empty]');
    await expect(empty).toBeVisible();
    await expect(empty).not.toBeEmpty();
  });

  test('API failure hides live stats instead of breaking the section', async ({ page }) => {
    await page.route('https://api.github.com/**', (route) => route.fulfill({ status: 500, body: 'boom' }));

    await page.goto('/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-github-panel]').scrollIntoViewIfNeeded();

    await expect(page.locator('.repo__stats')).toBeHidden();
  });

  test('API calls target the app repository only', async ({ page }) => {
    const urls = [];
    await page.route('https://api.github.com/**', (route) => {
      urls.push(route.request().url());
      const url = route.request().url();
      const body = url.includes('/issues') || url.includes('/contributors') ? [] : {};
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await page.goto('/index.html');
    await page.locator('[data-github-panel]').scrollIntoViewIfNeeded();
    await expect.poll(() => urls.length).toBeGreaterThan(0);

    expect(urls.every((url) => url.includes('/repos/hsay123/TGDrive'))).toBe(true);
    expect(urls.some((url) => url.includes('/repos/hsay123/TeleVaultt'))).toBe(false);
  });
});
