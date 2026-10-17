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
});
