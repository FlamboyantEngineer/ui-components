import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

function distanceToEnd(viewport: Locator) {
  return viewport.evaluate(
    (element) => element.scrollHeight - element.clientHeight - element.scrollTop,
  );
}

test('UIC-MESSAGE-SCROLLER-2.1 UIC-MESSAGE-SCROLLER-2.2 anchors, follows and allows native keyboard scrolling', async ({
  page,
  lab,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await lab.open('message-scroller');
  const viewport = page.getByRole('region', { name: 'Island conversation' });
  const prompt = page.getByRole('article', { name: 'Prompt' });
  const latest = page.getByRole('button', { name: 'Jump to latest' });
  await page.getByRole('button', { name: 'Add prompt' }).click();

  await expect
    .poll(async () => {
      const [view, item] = await Promise.all([viewport.boundingBox(), prompt.boundingBox()]);
      return view && item ? Math.round(item.y - view.y) : null;
    })
    .toBe(12);

  await page.getByRole('button', { name: 'Grow reply' }).click();
  await expect.poll(() => distanceToEnd(viewport)).toBe(0);
  await viewport.focus();
  await page.keyboard.press('Home');
  // Keyboard scrolling animates; jump only once it has reached the start, so it cannot carry on.
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(latest).toBeVisible();
  await latest.focus();
  await page.keyboard.press('Enter');
  await expect(viewport).toBeFocused();
  await expect.poll(() => distanceToEnd(viewport)).toBe(0);
  await lab.expectAccessible();
});
