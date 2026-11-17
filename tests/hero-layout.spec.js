import { test, expect } from '@playwright/test';

test('hero hands off to the next section without an empty scroll runway', async ({ page }) => {
  await page.goto('/index.html');

  const { pinHeight, heroHeight, viewport, fadeHeight, trustTop } = await page.evaluate(() => {
    const pin = document.getElementById('heroPin');
    const hero = document.getElementById('hero');
    const fade = document.querySelector('.hero-fade');
    const trust = document.querySelector('.trust');
    return {
      pinHeight: pin.offsetHeight,
      heroHeight: hero.getBoundingClientRect().height,
      viewport: window.innerHeight,
      fadeHeight: fade.offsetHeight,
      trustTop: trust.getBoundingClientRect().top + window.scrollY,
    };
  });

  // The pin trigger is the rendered hero canvas (or the 100vh background,
  // whichever is taller) — not a fixed runway with an extra blank viewport.
  expect(pinHeight).toBeLessThanOrEqual(Math.ceil(Math.max(viewport, heroHeight)) + 1);

  // After the pin and the hero fade, the trust strip is the next thing.
  expect(trustTop).toBeLessThanOrEqual(pinHeight + viewport + fadeHeight + 2);
});
