import type { Locator } from '@playwright/test';
import { expect } from './fixtures.js';

/**
 * Asserts that a popover and every control and day cell in it lie inside the viewport horizontally,
 * with nothing clipped past the popover's own edge. Parts inside `aria-hidden` (the visually hidden
 * native selects behind the heading selects) are not shown, so they are skipped.
 */
export async function expectPopoverFits(popover: Locator): Promise<void> {
  await expect(popover).toBeVisible();
  const outside = await popover.evaluate((element) => {
    const width = element.ownerDocument.documentElement.clientWidth;
    const parts = [element, ...element.querySelectorAll('button, [role="gridcell"], select')];
    return parts
      .filter((part) => !part.closest('[aria-hidden="true"]'))
      .map((part) => part.getBoundingClientRect())
      .filter((box) => box.width > 0 && (box.left < 0 || box.right > width + 0.5))
      .map((box) => `${Math.round(box.left)}..${Math.round(box.right)} of ${width}`);
  });
  expect(outside).toEqual([]);
  // Nothing is hidden past the popover's own edge either.
  const isClipped = await popover.evaluate(
    (element) => element.scrollWidth > element.clientWidth + 1,
  );
  expect(isClipped).toBe(false);
}
