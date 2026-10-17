import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

async function innerWidth(locator: Locator) {
  return locator.evaluate((node) => node.clientWidth);
}

test.describe('Split View lab', () => {
  test('UIC-SPLIT-VIEW-1.1 places fixed panes side by side or stacked', async ({ page, lab }) => {
    await lab.open('split-view');
    const horizontal = page.locator(
      '[data-lab-cell="ratio=equal orientation=horizontal"] .ui-split-view > *',
    );
    const [left, right] = [await box(horizontal.nth(0)), await box(horizontal.nth(1))];
    expect(left.y).toBe(right.y);
    expect(Math.abs(left.width - right.width)).toBeLessThanOrEqual(1);
    expect(right.x).toBeGreaterThan(left.x + left.width);

    const vertical = page.locator(
      '[data-lab-cell="ratio=equal orientation=vertical"] .ui-split-view > *',
    );
    const [top, bottom] = [await box(vertical.nth(0)), await box(vertical.nth(1))];
    expect(top.x).toBe(bottom.x);
    expect(bottom.y).toBeGreaterThan(top.y + top.height);

    const rail = page.locator(
      '[data-lab-cell="ratio=main-rail orientation=horizontal"] .ui-split-view > *',
    );
    expect((await box(rail.nth(1))).width).toBe(96);
    await expect(page.locator('[data-lab-section="Fixed ratios"] [role="separator"]')).toHaveCount(
      0,
    );
  });

  test('UIC-SPLIT-VIEW-2.1 UIC-SPLIT-VIEW-2.2 UIC-SPLIT-VIEW-3.1 paints the first pane at the separator value', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize horizontal split from 30%' });
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await expect(separator).toHaveAttribute('aria-valuenow', '30');
    await expect(separator).toHaveAttribute('aria-valuemin', '20');
    await expect(separator).toHaveAttribute('aria-valuemax', '80');
    await expect(separator).toHaveAttribute(
      'aria-controls',
      'horizontal-30-first horizontal-30-second',
    );
    const split = page.locator('[data-lab-cell="orientation=horizontal start=30"] .ui-split-view');
    const first = page.locator('#horizontal-30-first');
    expect(Math.round(((await box(first)).width / (await innerWidth(split))) * 100)).toBe(30);
    expect((await box(separator)).width).toBe(10);
    await expect(
      page.getByRole('separator', { name: 'Resize vertical split from 50%' }),
    ).toHaveAttribute('aria-orientation', 'horizontal');
    await lab.expectAccessible();
  });

  test('UIC-SPLIT-VIEW-3.2 resizes by keyboard within the bounds', async ({ page, lab }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize horizontal split from 30%' });
    const split = page.locator('[data-lab-cell="orientation=horizontal start=30"] .ui-split-view');
    await separator.focus();
    await page.keyboard.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', '35');
    const first = page.locator('#horizontal-30-first');
    expect(Math.round(((await box(first)).width / (await innerWidth(split))) * 100)).toBe(35);
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(separator).toHaveAttribute('aria-valuenow', '34');
    await page.keyboard.press('ArrowUp');
    await expect(separator).toHaveAttribute('aria-valuenow', '34');
    await page.keyboard.press('Home');
    await expect(separator).toHaveAttribute('aria-valuenow', '20');
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '80');
    await expect(split).not.toHaveAttribute('data-resizing');

    const stacked = page.getByRole('separator', { name: 'Resize vertical split from 50%' });
    await stacked.focus();
    await page.keyboard.press('ArrowDown');
    await expect(stacked).toHaveAttribute('aria-valuenow', '55');
  });

  test('UIC-SPLIT-VIEW-3.3 drags the separator with pointer capture behind a shield', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize horizontal split from 30%' });
    const split = page.locator('[data-lab-cell="orientation=horizontal start=30"] .ui-split-view');
    await separator.scrollIntoViewIfNeeded();
    const handle = await box(separator);
    const width = await innerWidth(split);
    const startX = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + width * 0.2, y, { steps: 4 });
    await expect(separator).toHaveAttribute('data-resizing', 'true');
    await expect(split).toHaveAttribute('data-resizing', 'true');
    const shield = page.locator('.ui-resize-handle__shield');
    await expect(shield).toHaveCount(1);
    expect(await shield.evaluate((node) => getComputedStyle(node).cursor)).toBe('col-resize');
    // The pointer stays captured when it leaves the split.
    await page.mouse.move(startX + width * 0.2, y + 400, { steps: 2 });
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow', '50');
    await expect(separator).not.toHaveAttribute('data-resizing');
    await expect(shield).toHaveCount(0);
  });

  test('UIC-SPLIT-VIEW-2.4 restores a persisted size after a reload', async ({ page, lab }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize persisted panes' });
    await expect(separator).toHaveAttribute('aria-valuenow', '40');
    await separator.focus();
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '60');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(page.getByRole('separator', { name: 'Resize persisted panes' })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
  });

  test('UIC-SPLIT-VIEW-3.2 grows the first pane with the Left arrow right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const first = await box(page.locator('#rtl-first'));
    const second = await box(page.locator('#rtl-second'));
    expect(first.x).toBeGreaterThan(second.x);
    const separator = page.getByRole('separator', { name: 'Resize right-to-left panes' });
    await separator.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(separator).toHaveAttribute('aria-valuenow', '45');
  });
});
