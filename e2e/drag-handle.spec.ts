import { expect, test } from './fixtures.js';

test.describe('Drag Handle lab', () => {
  test('UIC-DRAG-HANDLE-1.1 UIC-DRAG-HANDLE-1.2 reaches the handle from its row and drags by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('drag-handle');
    const list = page.locator('[data-lab-list]');
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
      page.locator('[data-lab-list]').getByRole('button', { name: 'Drag Fig' }),
    ).toBeDisabled();
    const disabled = page.locator('[data-lab-cell="state=disabled"] .ui-drag-handle');
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(page.locator('[data-lab-cell="state=enabled"] .ui-drag-handle')).toBeEnabled();
  });
});
