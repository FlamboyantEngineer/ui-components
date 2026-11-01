import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

// Reveals measured in the scroller's own pixels: under an ancestor `transform: scale(0.5)` each one
// still brings its target fully inside its scroller.

/** Draws `target` at half size from its top-left corner, as a zoomed preview or canvas does. */
async function scaleDown(target: Locator) {
  await target.evaluate((element) => {
    const style = (element as HTMLElement).style;
    style.transform = 'scale(0.5)';
    style.transformOrigin = '0 0';
  });
}

/** How far `inner` sticks out of `outer` on any side, in viewport pixels (0 when inside). */
async function overhang(inner: Locator, outer: Locator, inset: { top?: number } = {}) {
  const [a, b] = await Promise.all([inner.boundingBox(), outer.boundingBox()]);
  if (!a || !b) return Number.NaN;
  return Math.max(
    0,
    b.y + (inset.top ?? 0) - a.y,
    a.y + a.height - (b.y + b.height),
    b.x - a.x,
    a.x + a.width - (b.x + b.width),
  );
}

test.describe('Reveals under a scaled ancestor', () => {
  test('UIC-RELATION-MATRIX-2.1 keeps the focused cell in view of a scaled matrix', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-matrix');
    const demo = page.locator('[data-lab-demo="large"]');
    await scaleDown(demo);
    const matrix = demo.getByRole('grid', { name: 'Large matrix' });
    await matrix.locator('[role="row"][aria-rowindex="2"] > [aria-colindex="2"]').focus();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
    }
    const focused = matrix.locator(':focus');
    await expect(focused).toHaveAttribute('aria-colindex', '14');
    const corner = await matrix
      .locator('[role="row"][aria-rowindex="1"] > *')
      .first()
      .boundingBox();
    await expect
      .poll(() => overhang(focused, matrix, { top: corner?.height ?? 0 }))
      .toBeLessThanOrEqual(1);
  });

  test('UIC-COMPLETION-LIST-1.2 keeps the active option in view of a scaled list', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const demo = page.locator('[data-lab-demo="shadow-completions"]');
    await demo.scrollIntoViewIfNeeded();
    await scaleDown(demo);
    await demo.getByRole('combobox', { name: 'Shadow city' }).focus();
    const list = demo.getByRole('listbox');
    await expect(list).toBeVisible();
    await page.keyboard.press('ArrowUp');
    const active = list.locator('[role="option"][aria-selected="true"]');
    await expect.poll(() => overhang(active, list)).toBeLessThanOrEqual(1);
    for (let step = 0; step < 3; step += 1) await page.keyboard.press('ArrowDown');
    await expect.poll(() => overhang(active, list)).toBeLessThanOrEqual(1);
  });

  test('UIC-TABS-2.4 centers the selected tab of a scaled strip', async ({ page, lab }) => {
    await lab.open('tabs');
    const list = page.getByRole('tablist', { name: 'Cities' });
    await scaleDown(list);
    const middle = list.getByRole('tab', { name: 'Edinburgh castle' });
    await middle.click();
    await expect
      .poll(async () => {
        const [listBox, tabBox] = await Promise.all([list.boundingBox(), middle.boundingBox()]);
        if (!listBox || !tabBox) return Number.NaN;
        return Math.abs(tabBox.x + tabBox.width / 2 - (listBox.x + listBox.width / 2));
      })
      .toBeLessThanOrEqual(1);
  });

  test('UIC-CHAT-TRANSCRIPT-3.1 brings a focused message into view of a scaled feed', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const feed = page.getByRole('feed', { name: 'Keyboard conversation' });
    const viewport = feed.locator(
      'xpath=ancestor::*[contains(@class,"ui-scroll-region__viewport")][1]',
    );
    // A short view, so that each message has to be scrolled to.
    await viewport.evaluate((element) => {
      (element as HTMLElement).style.height = '120px';
      (element as HTMLElement).style.maxHeight = '120px';
    });
    await scaleDown(feed.locator('xpath=ancestor::*[contains(@class,"ui-scroll-region")][last()]'));
    await page.getByRole('textbox', { name: 'Message the planner' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(feed.locator('#k5')).toBeFocused();
    expect(
      await viewport.evaluate((element) => element.scrollHeight > element.clientHeight * 2),
    ).toBe(true);
    await page.keyboard.press('Home');
    await expect(feed.locator('#k1')).toBeFocused();
    await expect.poll(() => overhang(feed.locator('#k1'), viewport)).toBeLessThanOrEqual(1);
    for (const id of ['#k2', '#k3', '#k4']) {
      await page.keyboard.press('ArrowDown');
      await expect(feed.locator(id)).toBeFocused();
      const box = await feed.locator(id).boundingBox();
      const view = await viewport.boundingBox();
      // Shown whole, or from its top when it is taller than the view.
      if ((box?.height ?? 0) < (view?.height ?? 0)) {
        await expect.poll(() => overhang(feed.locator(id), viewport)).toBeLessThanOrEqual(1);
      }
    }
  });

  test('UIC-SCROLL-REGION-4.5 follows the scroll of a scaled viewport', async ({ page, lab }) => {
    await lab.open('outline');
    const demo = page.locator('[data-lab-demo="reader"]');
    await scaleDown(demo);
    const outline = demo.getByRole('navigation', { name: 'Guide' });
    const current = outline.locator('[aria-current="location"]');
    const viewport = demo.getByRole('region', { name: 'Guide text' });
    // Puts the heading `below` of the viewport's own pixels under its top; the outline tracks 40.
    const place = (below: number) =>
      viewport.evaluate((element, below) => {
        const view = element as HTMLElement;
        const heading = view.querySelector('#guide-air') as HTMLElement;
        const scale = view.getBoundingClientRect().height / view.offsetHeight;
        const top =
          (heading.getBoundingClientRect().top - view.getBoundingClientRect().top) / scale +
          view.scrollTop;
        view.scrollTop = top - below;
      }, below);
    await place(60);
    await expect(current).not.toHaveText('2.2 By air');
    await place(20);
    await expect(current).toHaveText('2.2 By air');
  });

  test('UIC-MERGE-VIEW-1.3 scrolls the panes of a scaled merge together', async ({ page, lab }) => {
    await lab.open('merge-view');
    const settings = page.locator('[data-lab-field="settings"]');
    await scaleDown(settings);
    const viewport = (side: string) =>
      settings.locator(`[data-side="${side}"] .ui-scroll-region__viewport`);
    await viewport('ours').evaluate((element) => {
      element.scrollTop = 60;
    });
    await expect
      .poll(async () => Math.abs((await viewport('theirs').evaluate((e) => e.scrollTop)) - 60))
      .toBeLessThan(2);
  });
});
