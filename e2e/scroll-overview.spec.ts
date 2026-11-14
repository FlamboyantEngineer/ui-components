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

  test('UIC-SCROLL-OVERVIEW-1.3 UIC-SCROLL-OVERVIEW-1.4 pages toward a press on the track without pressable markers', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-overview');
    const strip = page.locator('[data-lab-demo="layers"] .ui-scroll-overview');
    const region = page.getByRole('region', { name: 'Layered steps' });
    await expect(strip).not.toHaveAttribute('data-interactive');
    await expect(strip).toHaveCSS('background-image', /color-mix|linear-gradient/);
    const height = (await box(strip)).height;
    await strip.click({ position: { x: 4, y: height - 4 } });
    await expect
      .poll(() => region.evaluate((node) => node.scrollTop))
      .toBe(await region.evaluate((node) => node.clientHeight));
  });

  test('UIC-SCROLL-OVERVIEW-1.4 draws a thumb over the marks that follows and drives the scroll', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-overview');
    const demo = page.locator('[data-lab-demo="elements"]');
    const strip = demo.locator('.ui-scroll-overview');
    const thumb = strip.locator('.ui-scroll-overview__thumb');
    const steps = demo.getByRole('region', { name: 'Steps' });
    await expect(strip).toHaveAttribute('data-scrollable', 'true');
    await expect(thumb).toBeVisible();
    // The native scrollbar is hidden: the overview is the list's scrollbar.
    expect(
      await steps.evaluate((node) => node.getBoundingClientRect().width - node.clientWidth),
    ).toBe(0);
    const track = await box(strip);
    const start = await box(thumb);
    expect(start.y).toBe(track.y);
    expect(start.height / track.height).toBeCloseTo(
      await steps.evaluate((node) => node.clientHeight / node.scrollHeight),
      1,
    );
    // Scrolling the list moves the thumb to the end of the track.
    await steps.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect
      .poll(async () => {
        const moved = await box(thumb);
        return Math.round(moved.y + moved.height);
      })
      .toBe(Math.round(track.y + track.height));
    // Dragging the thumb back up scrolls the list to the top, and its click pages nowhere.
    const end = await box(thumb);
    await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width / 2, track.y - 20, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => steps.evaluate((node) => node.scrollTop)).toBe(0);
    await expect(demo.locator('[data-lab-jumped]')).toHaveText('none');
    await lab.expectAccessible('[data-lab-section="Element markers"]');
  });
});
