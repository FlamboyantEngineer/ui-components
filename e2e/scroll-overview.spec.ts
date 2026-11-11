import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no box');
  return result;
}

test.describe('Scroll Overview lab', () => {
  test('UIC-SCROLL-OVERVIEW-1.1 UIC-SCROLL-OVERVIEW-1.2 marks elements and follows a new one', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-overview');
    const demo = page.locator('[data-lab-demo="elements"]');
    const strip = demo.locator('.ui-scroll-overview');
    const steps = demo.getByRole('region', { name: 'Steps' });
    await expect(strip).toHaveAttribute('aria-hidden', 'true');
    expect((await box(strip)).height).toBe(await steps.evaluate((node) => node.clientHeight));
    const image = () => strip.evaluate((node) => getComputedStyle(node).backgroundImage);
    await expect.poll(image).toMatch(/^linear-gradient/);
    const before = await image();
    await demo.getByRole('button', { name: 'Mark step 25' }).click();
    await expect.poll(image).not.toBe(before);
  });

  test('UIC-SCROLL-OVERVIEW-1.3 scrolls to a pressed marker', async ({ page, lab }) => {
    await lab.open('scroll-overview');
    const demo = page.locator('[data-lab-demo="elements"]');
    const strip = demo.locator('.ui-scroll-overview');
    const steps = demo.getByRole('region', { name: 'Steps' });
    await expect(strip).toHaveAttribute('data-interactive', 'true');
    const metrics = await steps.evaluate((node) => {
      const target = node.querySelectorAll('p')[17];
      if (!target) throw new Error('no step 18');
      const top = target.getBoundingClientRect().top - node.getBoundingClientRect().top;
      return { top, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight };
    });
    const y = Math.ceil((metrics.top / metrics.scrollHeight) * metrics.clientHeight) + 1;
    await strip.click({ position: { x: 4, y } });
    await expect(demo.locator('[data-lab-jumped]')).toHaveText('step 18');
    await expect.poll(() => steps.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  });

  test('UIC-SCROLL-OVERVIEW-1.3 lets presses through a decorative strip', async ({ page, lab }) => {
    await lab.open('scroll-overview');
    const strip = page.locator('[data-lab-demo="layers"] .ui-scroll-overview');
    await expect(strip).not.toHaveAttribute('data-interactive');
    await expect(strip).toHaveCSS('pointer-events', 'none');
    await expect(strip).toHaveCSS('background-image', /color-mix|linear-gradient/);
  });
});
