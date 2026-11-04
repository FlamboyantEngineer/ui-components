import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

/** Scrolls the link just below the lab's sticky header, near the top of the window. */
async function toTop(link: Locator) {
  await link.evaluate((element) => {
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    element.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -(header + 8));
  });
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return box;
}

test.describe('Hover Card lab coverage', () => {
  for (const action of ['Remove this preview', 'Close preview externally']) {
    test(`UIC-HOVER-CARD-1.2 UIC-HOVER-CARD-1.4 restores the delay after ${action}`, async ({
      page,
      lab,
    }) => {
      await page.clock.install();
      await lab.open('hover-card');
      const area = demo(page, 'hover-lifecycle');
      await area.getByRole('button', { name: 'Add lifecycle preview' }).click();
      await area.getByRole('link', { name: 'Kyoto' }).hover();
      const first = page.getByRole('dialog', { name: 'About Kyoto' });
      await expect(first).toBeVisible();
      await expect(first).not.toHaveAttribute('data-entering');
      await page.clock.pauseAt(Date.now() + 1000);
      // Keyboard activation keeps pointer travel and actionability frames off the paused clock.
      await first.getByRole('button', { name: action }).focus();
      await page.keyboard.press('Enter');
      await page.clock.runFor(60_000);
      await expect(first).toHaveCount(0);
      if (action === 'Remove this preview') {
        await expect(area.getByRole('link', { name: 'Kyoto' })).toHaveCount(0);
      } else {
        await expect(area.getByRole('link', { name: 'Kyoto' })).toBeVisible();
      }

      const next = area.getByRole('link', { name: 'Nara' });
      await page.mouse.move(0, 0);
      await next.hover();
      const card = page.getByRole('dialog', { name: 'About Nara' });
      await expect(card).toHaveCount(0);
      await page.clock.runFor(599);
      await expect(card).toHaveCount(0);
      await page.clock.runFor(1);
      await expect(card).toBeVisible();
    });
  }

  test('UIC-HOVER-CARD-2.2 applies offset, cross offset and flipping near the top of the window', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    const area = demo(page, 'hover-geometry');
    const link = area.getByRole('link', { name: 'Bergen' });
    const card = page.locator('[data-lab-card="tuned"]');
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(card).toBeVisible();
    const anchor = await boxOf(link);
    const above = await boxOf(card);
    // Above the link, 16 pixels away (the arrow sits in the gap).
    expect(anchor.y - (above.y + above.height)).toBeCloseTo(16, -1);
    await page.mouse.move(0, 0);
    await expect(card).toHaveCount(0);

    // At the top of the window it flips below, unless flipping is off. Room below the page lets
    // the link scroll up there.
    await page.evaluate(() => {
      document.body.style.paddingBottom = '100vh';
    });
    await toTop(link);
    await link.hover();
    await expect(card).toBeVisible();
    expect((await boxOf(card)).y).toBeGreaterThan((await boxOf(link)).y);
    await page.mouse.move(0, 0);
    await expect(card).toHaveCount(0);
    await area.getByText('Flip when it does not fit').click();
    await expect(area.locator('[data-lab-output="position"]')).toContainText('shouldFlip false');
    await toTop(link);
    await link.hover();
    await expect(card).toBeVisible();
    expect((await boxOf(card)).y).toBeLessThan((await boxOf(link)).y);
  });

  test('UIC-HOVER-CARD-1.4 opens on mount with defaultOpen', async ({ page, lab }) => {
    await lab.open('hover-card');
    const area = demo(page, 'hover-default-open');
    await area.getByRole('button', { name: 'Add the preview' }).click();
    await expect(page.locator('[data-lab-card="default-open"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-lab-card="default-open"]')).toHaveCount(0);
    await expect(area.locator('[data-lab-output="hover-default-open"]')).toHaveText(
      'Changes: closed',
    );
  });
});
