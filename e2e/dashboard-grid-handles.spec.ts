import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

test.describe('Dashboard Grid handles', () => {
  test('UIC-DASHBOARD-GRID-2.1 lays ghost handles over the tile without moving its content', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const demo = page.locator('[data-lab-demo="overview"]');
    const grid = demo.getByRole('group', { name: 'Overview' });
    const tile = grid.getByRole('group', { name: 'Orders', exact: true });
    const content = tile.locator('.ui-dashboard-grid__tile-content');
    const editing = requireDefined(await content.boundingBox());
    const tileBox = requireDefined(await tile.boundingBox());
    const move = tile.getByRole('button', { name: 'Move Orders' });
    const resize = tile.getByRole('button', { name: 'Resize Orders' });
    for (const handle of [move, resize]) {
      const style = await handle.evaluate((node) => {
        const computed = getComputedStyle(node);
        return [computed.backgroundColor, computed.borderTopWidth];
      });
      expect(style).toEqual(['rgba(0, 0, 0, 0)', '0px']);
      const box = requireDefined(await handle.boundingBox());
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(20);
      // The handle lies over the content, inside the tile.
      expect(box.y).toBeGreaterThanOrEqual(editing.y - 0.5);
      expect(box.y + box.height).toBeLessThanOrEqual(editing.y + editing.height + 0.5);
    }
    const moveBox = requireDefined(await move.boundingBox());
    const resizeBox = requireDefined(await resize.boundingBox());
    const middle = moveBox.x + moveBox.width / 2 - (tileBox.x + tileBox.width / 2);
    expect(Math.abs(middle)).toBeLessThanOrEqual(1);
    expect(moveBox.y - tileBox.y).toBeLessThan(4);
    expect(tileBox.x + tileBox.width - (resizeBox.x + resizeBox.width)).toBeLessThan(8);
    await expect(resize.locator('[data-glyph="resize"]')).toBeVisible();
    await move.focus();
    const ring = await move.evaluate((node) => getComputedStyle(node).outlineStyle);
    expect(ring).not.toBe('none');

    await demo.getByRole('button', { name: 'Done editing' }).click();
    await expect(move).toHaveCount(0);
    const reading = requireDefined(await content.boundingBox());
    expect(reading).toEqual(editing);
  });

  test('UIC-DASHBOARD-GRID-2.1 mirrors the handles right to left', async ({ page, lab }) => {
    await lab.open('dashboard-grid');
    const demo = page.locator('[data-lab-demo="overview"]');
    await demo.evaluate((element) => element.setAttribute('dir', 'rtl'));
    const tile = demo.getByRole('group', { name: 'Orders', exact: true });
    const tileBox = requireDefined(await tile.boundingBox());
    const move = requireDefined(
      await tile.getByRole('button', { name: 'Move Orders' }).boundingBox(),
    );
    const resize = requireDefined(
      await tile.getByRole('button', { name: 'Resize Orders' }).boundingBox(),
    );
    expect(Math.abs(move.x + move.width / 2 - (tileBox.x + tileBox.width / 2))).toBeLessThanOrEqual(
      1,
    );
    expect(resize.x - tileBox.x).toBeLessThan(8);
  });
});
