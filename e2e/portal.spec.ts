import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const layers = ['backdrop', 'drawer', 'modal', 'dropdown', 'context-menu', 'tooltip', 'toast'];

/** The card drawn topmost at an offset from the top-left of a stacking cell's stage. */
async function topCardAt(page: Page, order: string, { x, y }: { x: number; y: number }) {
  const stage = await page
    .locator(`[data-lab-cell="order=${order}"] [data-lab-stage]`)
    .boundingBox();
  if (!stage) throw new Error('stage not rendered');
  return page.evaluate(
    ([px, py]) =>
      document
        .elementFromPoint(px as number, py as number)
        ?.closest('[data-lab-card]')
        ?.getAttribute('data-lab-card') ?? null,
    [stage.x + x, stage.y + y],
  );
}

test.describe('Portal lab', () => {
  test('UIC-PORTAL-1.3 UIC-PORTAL-2.1 UIC-PORTAL-2.2 mounts each layer in its cell host with its z-index', async ({
    page,
    lab,
  }) => {
    await lab.open('portal');
    for (const [index, layer] of layers.entries()) {
      const cell = page.locator(`[data-lab-cell="layer=${layer}"]`);
      const wrapper = cell.locator('.ui-portal-host > .ui-portal');
      await expect(wrapper).toHaveAttribute('data-layer', layer);
      await expect(wrapper).toHaveCSS('z-index', String(100 + index * 10));
      await expect(wrapper).toHaveCSS('position', 'absolute');
      const stage = await cell.locator('[data-lab-stage]').boundingBox();
      const box = await wrapper.boundingBox();
      expect(box?.x).toBeCloseTo(stage?.x ?? -1, 0);
      expect(box?.y).toBeCloseTo(stage?.y ?? -1, 0);
    }
    await lab.expectAccessible();
  });

  test('UIC-PORTAL-2.2 keeps later layers on top whatever the mount order', async ({
    page,
    lab,
  }) => {
    await lab.open('portal');
    for (const order of ['lowest first', 'highest first']) {
      expect(await topCardAt(page, order, { x: 80, y: 48 })).toBe('toast');
      expect(await topCardAt(page, order, { x: 4, y: 3 })).toBe('backdrop');
      expect(await topCardAt(page, order, { x: 12, y: 8 })).toBe('drawer');
    }
  });

  test('UIC-PORTAL-2.2 stacks by layer without any stylesheet', async ({ page, lab }) => {
    await lab.open('portal', { stylesheet: 'none' });
    expect(await topCardAt(page, 'highest first', { x: 80, y: 48 })).toBe('toast');
  });

  test('UIC-PORTAL-1.1 UIC-PORTAL-3.1 renders into the document body and stays keyboard operable', async ({
    page,
    lab,
  }) => {
    await lab.open('portal');
    await page.getByRole('button', { name: 'Show notice' }).click();
    const wrapper = page.locator('body > .ui-portal[data-layer="toast"]');
    await expect(wrapper).toHaveCount(1);
    await expect(wrapper).not.toHaveAttribute('role');
    await expect(wrapper).not.toHaveAttribute('tabindex');
    await expect(page.getByRole('status')).toHaveText(/Report\.pdf saved/);
    await page.getByRole('button', { name: 'Dismiss' }).focus();
    await page.keyboard.press('Enter');
    await expect(wrapper).toHaveCount(0);
  });

  test('UIC-PORTAL-3.2 stays usable while a React Aria modal is open', async ({ page, lab }) => {
    await lab.open('portal');
    await page.getByRole('button', { name: 'Choose a colour' }).click();
    const dialog = page.getByRole('dialog', { name: 'Colour' });
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Show colours' }).click();

    await expect(page.getByRole('list', { name: 'Colours' })).toBeVisible();
    const colours = page.locator('[data-lab-colours]');
    await expect(colours).toHaveAttribute('data-react-aria-top-layer', 'true');
    const inInertTree = (node: Element) => node.closest('[inert], [aria-hidden="true"]') !== null;
    expect(await page.getByRole('button', { name: 'Show notice' }).evaluate(inInertTree)).toBe(
      true,
    );
    expect(await page.getByRole('button', { name: 'Teal' }).evaluate(inInertTree)).toBe(false);

    await page.getByRole('button', { name: 'Plum' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-lab-chosen]')).toHaveText('Chosen: Plum');

    await page.getByRole('button', { name: 'Show colours' }).click();
    const amber = page.getByRole('button', { name: 'Amber' });
    await amber.focus();
    await expect(amber).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog.locator('[data-lab-chosen]')).toHaveText('Chosen: Amber');
    await expect(page.getByRole('button', { name: 'Show colours' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('UIC-PORTAL-1.5 renders in place with its layer', async ({ page, lab }) => {
    await lab.open('portal');
    const stage = page.locator('[data-lab-in-place]');
    const wrapper = stage.locator(':scope > .ui-portal');
    await expect(wrapper).toHaveAttribute('data-layer', 'tooltip');
    await expect(wrapper).toHaveAttribute('data-react-aria-top-layer', 'true');
    await expect(wrapper).toHaveCSS('z-index', '150');
    await expect(wrapper).toHaveCSS('position', 'absolute');
    const stageBox = await stage.boundingBox();
    const box = await wrapper.boundingBox();
    expect(box?.x).toBeCloseTo(stageBox?.x ?? -1, 0);
    expect(box?.y).toBeCloseTo(stageBox?.y ?? -1, 0);
  });

  test('UIC-PORTAL-3.4 keeps portalled tools in the tab order of their toggle', async ({
    page,
    lab,
  }) => {
    await lab.open('portal');
    const toggle = page.getByRole('button', { name: 'Show Kept order tools' });
    await toggle.click();
    const tools = page.getByRole('group', { name: 'Kept order tools' });
    await expect(tools).toBeVisible();
    expect(await tools.evaluate((node) => node.closest('.ui-portal')?.parentElement?.tagName)).toBe(
      'BODY',
    );
    const hide = page.getByRole('button', { name: 'Hide Kept order tools' });
    await expect(hide).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(tools.getByRole('button', { name: 'Cut' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(tools.getByRole('button', { name: 'Copy' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Kept order next' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(tools.getByRole('button', { name: 'Copy' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(hide).toBeFocused();
    await lab.expectAccessible();

    const other = page.getByRole('button', { name: 'Show Document order tools' });
    await other.click();
    await expect(page.getByRole('group', { name: 'Document order tools' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Document order next' })).toBeFocused();
  });
});
