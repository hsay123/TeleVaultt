import { test, expect } from '@playwright/test';

const APP = 'https://github.com/hsay123/TGDrive';

const panel = (page) => page.locator('#menuPanel');
const toggle = (page) => page.locator('#menuToggle');
const firstLink = (page) => page.locator('.menu-panel__nav a').first();

const openMenu = async (page) => {
  await toggle(page).click();
  await expect(panel(page)).toHaveClass(/is-open/);
  // Wait for the morph to settle so geometry is measured at rest.
  await expect(panel(page)).toHaveClass(/is-settled/);
};

// Smooth scrolling is animated, so wait until it stops before toggling again.
const scrollSettled = async (page) => {
  await expect
    .poll(
      async () => {
        const first = await page.evaluate(() => Math.round(window.scrollY));
        await page.waitForTimeout(150);
        const second = await page.evaluate(() => Math.round(window.scrollY));
        return Math.abs(first - second) <= 1;
      },
      { timeout: 8000 },
    )
    .toBe(true);
};

test.describe('header menu popover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('opens as a compact panel anchored under the button', async ({ page }) => {
    await expect(panel(page)).toBeHidden();

    await openMenu(page);

    await expect(panel(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle(page)).toHaveAttribute('aria-controls', 'menuPanel');

    const box = await panel(page).boundingBox();
    const button = await toggle(page).boundingBox();
    const viewport = page.viewportSize();

    // Compact: never a full-screen takeover.
    expect(box.width).toBeLessThanOrEqual(280);
    expect(box.height).toBeLessThan(viewport.height * 0.85);

    // Anchored: right edges line up, panel starts below the button.
    expect(Math.abs(box.x + box.width - (button.x + button.width))).toBeLessThanOrEqual(2);
    expect(box.y).toBeGreaterThan(button.y + button.height - 1);

    // Within the viewport.
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });

  test('morphs width, height and radius on one easing curve', async ({ page }) => {
    await openMenu(page);

    const motion = await panel(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        properties: style.transitionProperty,
        durations: style.transitionDuration,
        easings: style.transitionTimingFunction,
        radius: style.borderRadius,
      };
    });

    expect(motion.properties).toContain('width');
    expect(motion.properties).toContain('height');
    expect(motion.properties).toContain('border-radius');
    expect(motion.durations).toContain('0.8s');
    expect(motion.easings).toContain('cubic-bezier(0.22, 1, 0.36, 1)');
    expect(motion.radius).toBe('24px');

    // The closed pill collapses its height faster than its width, as in the
    // reference: the rectangle becomes a short bar before it becomes a pill.
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    const closing = await panel(page).evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(closing).toContain('0.15s');
  });

  test('floods the panel with the dark surface', async ({ page }) => {
    await openMenu(page);

    const flood = page.locator('.menu-panel__flood');
    const box = await panel(page).boundingBox();
    const disc = await flood.boundingBox();

    // The disc has risen to cover the panel and is clipped by its corners.
    expect(disc.y).toBeLessThanOrEqual(box.y + 2);
    expect(disc.width).toBeGreaterThan(box.width);
    await expect(flood).toHaveCSS('background-color', 'rgb(16, 21, 28)');
  });

  test('transforms the hamburger into a close icon', async ({ page }) => {
    const bar = page.locator('.menu-toggle__bar').first();
    const before = await bar.evaluate((el) => getComputedStyle(el).transform);

    await openMenu(page);

    const after = await bar.evaluate((el) => getComputedStyle(el).transform);
    expect(after).not.toBe(before);
    expect(after).toMatch(/matrix\(0\.7071/);
    await expect(bar).toHaveCSS('transform', /matrix\(0\.7071/);
  });

  test('keeps every navigation option and destination', async ({ page }) => {
    await openMenu(page);

    const links = page.locator('.menu-panel__nav a');
    await expect(links).toHaveCount(6);
    await expect(links.nth(0)).toHaveAttribute('href', '#top');
    await expect(links.nth(1)).toHaveAttribute('href', '#features');
    await expect(links.nth(2)).toHaveAttribute('href', '#how-it-works');
    await expect(links.nth(3)).toHaveAttribute('href', '#security');
    await expect(links.nth(4)).toHaveAttribute('href', '#contribute');
    await expect(links.nth(5)).toHaveAttribute('href', '#faq');

    await expect(page.locator('.menu-panel__brand')).toHaveText('TeleVault');
    await expect(page.locator('.menu-panel__cta')).toHaveAttribute('href', APP);
    await expect(page.locator('.menu-panel__gh')).toHaveAttribute('href', APP);

    // Every label keeps a readable accessible name after being split into
    // roll characters.
    await expect(links.nth(2)).toHaveAttribute('aria-label', 'How it Works');
    await expect(page.locator('.menu-panel__gh')).toHaveAttribute('aria-label', 'View on GitHub');
    expect(await page.locator('.roll__char').count()).toBeGreaterThan(30);
  });

  test('rolls characters on hover', async ({ page }) => {
    await openMenu(page);

    const features = page.locator('.menu-panel__nav').getByRole('link', { name: 'Features', exact: true });
    const track = features.locator('.roll__track').first();
    const before = await track.evaluate((el) => getComputedStyle(el).transform);

    await features.hover();

    await expect.poll(() => track.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before);
    expect(await track.evaluate((el) => getComputedStyle(el).transform)).toMatch(/matrix\(1, 0, 0, 1, 0, -/);
  });

  test('closes on an outside click', async ({ page }) => {
    await openMenu(page);
    await page.mouse.click(24, 320);

    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes on Escape and returns focus to the button', async ({ page }) => {
    await openMenu(page);
    await expect(firstLink(page)).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
  });

  test('closes when a navigation option is chosen', async ({ page }) => {
    await openMenu(page);
    await page.locator('.menu-panel__nav').getByRole('link', { name: 'Features', exact: true }).click();

    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('navigates to every section and closes', async ({ page }) => {
    const destinations = [
      ['Features', '#features'],
      ['How it Works', '#how-it-works'],
      ['Security', '#security'],
      ['Contribute', '#contribute'],
      ['FAQ', '#faq'],
    ];

    for (const [name, hash] of destinations) {
      await page.evaluate(() => {
        history.replaceState(null, '', location.pathname);
        window.scrollTo(0, 0);
      });
      await scrollSettled(page);

      await openMenu(page);
      await page.locator('.menu-panel__nav').getByRole('link', { name, exact: true }).click();

      await expect(panel(page)).toBeHidden();
      await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(0);
      await expect
        .poll(() =>
          page.evaluate((id) => Math.round(document.querySelector(id).getBoundingClientRect().top), hash),
        )
        .toBeLessThan(220);
      await expect.poll(() => page.evaluate(() => location.hash)).toBe(hash);
      await scrollSettled(page);
    }
  });

  test('toggles cleanly on repeated clicks', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      await openMenu(page);
      await toggle(page).click();
      await expect(panel(page)).toBeHidden();
    }
  });

  test('moves focus through the panel with Tab', async ({ page }) => {
    await openMenu(page);

    await page.keyboard.press('Tab');
    await expect(page.locator('.menu-panel__nav a').nth(1)).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(firstLink(page)).toBeFocused();
  });

  test('closes when the page scrolls', async ({ page }) => {
    await openMenu(page);

    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 500);

    await expect(panel(page)).toBeHidden();
  });

  test('opens without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await openMenu(page);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();

    expect(errors).toEqual([]);
  });
});

test.describe('header menu on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('stays compact and inside the viewport', async ({ page }) => {
    await page.goto('/index.html');
    await openMenu(page);

    const box = await panel(page).boundingBox();
    const button = await toggle(page).boundingBox();

    expect(box.width).toBeLessThanOrEqual(280);
    expect(box.height).toBeLessThan(844 * 0.85);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect(Math.abs(box.x + box.width - (button.x + button.width))).toBeLessThanOrEqual(2);

    // Touch targets stay at 44px on small screens.
    const first = await page.locator('.menu-panel__nav a').first().boundingBox();
    expect(first.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('header menu on a short viewport', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

  test('clamps the panel and keeps the last action reachable', async ({ page }) => {
    await page.goto('/index.html');
    await openMenu(page);

    const box = await panel(page).boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(390);

    await page.locator('.menu-panel__gh').scrollIntoViewIfNeeded();
    await expect(page.locator('.menu-panel__gh')).toBeVisible();
  });
});

test.describe('header menu with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('opens without a transform animation', async ({ page }) => {
    await page.goto('/index.html');
    await openMenu(page);

    const transform = await panel(page).evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);

    const duration = await panel(page).evaluate((el) =>
      getComputedStyle(el)
        .transitionDuration.split(',')
        .map((value) => Number.parseFloat(value)),
    );
    expect(duration.every((value) => value < 0.05)).toBe(true);
  });
});
