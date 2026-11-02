import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

/** Which card paints on top where the level's host panel and tooltip portal overlap. */
async function topmost(page: Page, level: string) {
  const panel = page.locator(`[data-lab-host-panel="${level}"]`);
  await panel.scrollIntoViewIfNeeded();
  const box = await panel.boundingBox();
  if (!box) throw new Error('not rendered');
  return page.evaluate(
    ([x, y]) => {
      const element = document.elementFromPoint(x as number, y as number);
      return element?.closest('[data-lab-host-panel]')
        ? 'host panel'
        : element?.closest('[data-lab-tooltip-card]')
          ? 'tooltip portal'
          : 'other';
    },
    [box.x + box.width - 4, box.y + box.height - 2],
  );
}

test.describe('Portal lab layers', () => {
  test('UIC-PORTAL-2.2 useLayerZIndex reads the z-index in effect under nested overrides', async ({
    page,
    lab,
  }) => {
    await lab.open('portal');
    await expect(page.locator('[data-lab-output="layer-default"]')).toHaveText(
      'default: dropdown 130, tooltip 150',
    );
    await expect(page.locator('[data-lab-output="layer-outer"]')).toHaveText(
      'outer: dropdown 130, tooltip 500',
    );
    await expect(page.locator('[data-lab-output="layer-inner"]')).toHaveText(
      'inner: dropdown 600, tooltip 500',
    );
    expect(await topmost(page, 'default')).toBe('tooltip portal');
    expect(await topmost(page, 'outer')).toBe('tooltip portal');
    expect(await topmost(page, 'inner')).toBe('host panel');
  });
});
