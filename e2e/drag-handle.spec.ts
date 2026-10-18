import { expect, test } from './fixtures.js';

test.describe('Drag Handle lab', () => {
  test('UIC-DRAG-HANDLE-1.1 UIC-DRAG-HANDLE-1.2 reaches the handle from its row and drags by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('drag-handle');
    const list = page.locator('[data-lab-list="row"]');
    const banana = list.getByRole('row', { name: 'Banana', exact: true });
    const handle = list.getByRole('button', { name: 'Drag Banana' });
    await expect(handle).toHaveAttribute('tabindex', '-1');
    await banana.focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(banana).toHaveAttribute('data-dragging', 'true');
    await page.keyboard.press('Escape');
    await expect(banana).not.toHaveAttribute('data-dragging');
    await expect(list.locator('[data-lab-output]')).toHaveText('Order: Apple, Banana, Cherry, Fig');
    await lab.expectAccessible();
  });

  test('UIC-DRAG-HANDLE-1.3 disables the handle of a row that cannot move', async ({
    page,
    lab,
  }) => {
    await lab.open('drag-handle');
    await expect(
      page.locator('[data-lab-list="row"]').getByRole('button', { name: 'Drag Fig' }),
    ).toBeDisabled();
    const disabled = page.locator('[data-lab-cell="state=disabled"] .ui-drag-handle');
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(page.locator('[data-lab-cell="state=enabled"] .ui-drag-handle')).toBeEnabled();
  });

  test('UIC-DRAG-HANDLE-2.1 starts a pointer drag only from the handle', async ({ page, lab }) => {
    await lab.open('drag-handle');
    const list = page.locator('[data-lab-list="handle"]');
    const output = list.locator('[data-lab-output]');
    // A table row is named by its row header, which also holds the handle (Drag Apple Apple).
    const apple = list.getByRole('row', { name: 'Apple' });
    const cherry = list.getByRole('row', { name: 'Cherry' });
    await expect(apple).not.toHaveAttribute('draggable');
    await apple.dragTo(cherry, { sourcePosition: { x: 80, y: 10 } });
    await expect(output).toHaveText('Order: Apple, Banana, Cherry, Fig');
    const handle = await list.getByRole('button', { name: 'Drag Apple' }).boundingBox();
    const target = await cherry.boundingBox();
    if (!handle || !target) throw new Error('no handle');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 80, target.y + target.height - 3, { steps: 8 });
    await page.mouse.up();
    await expect(output).toHaveText('Order: Banana, Cherry, Apple, Fig');
    await expect(apple).not.toHaveAttribute('draggable');
    await lab.expectAccessible();
  });
});
