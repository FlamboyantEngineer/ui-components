import { expect, test } from './fixtures.js';

test.describe('Zoom Control lab', () => {
  test('UIC-ZOOM-CONTROL-1.1 UIC-ZOOM-CONTROL-1.5 UIC-ZOOM-CONTROL-1.9 draws the parts in order at four sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    for (const [size, edge] of [
      ['xs', 22],
      ['sm', 26],
      ['md', 32],
      ['lg', 38],
    ] as const) {
      const group = page
        .locator(`[data-lab-cell="state=default size=${size}"]`)
        .getByRole('group', { name: `Zoom default ${size}` });
      const zoomOut = await group.getByRole('button', { name: 'Zoom out' }).boundingBox();
      const slider = await group.getByRole('slider', { name: 'Zoom level' }).boundingBox();
      const zoomIn = await group.getByRole('button', { name: 'Zoom in' }).boundingBox();
      const value = await group.locator('output').boundingBox();
      expect(zoomOut?.width).toBe(edge);
      expect(zoomIn?.height).toBe(edge);
      expect(zoomOut!.x).toBeLessThan(slider!.x);
      expect(slider!.x).toBeLessThan(zoomIn!.x);
      expect(zoomIn!.x).toBeLessThan(value!.x);
    }
    await expect(page.locator('[data-lab-cell="state=between levels size=sm"] output')).toHaveText(
      '137.5%',
    );
  });

  test('UIC-ZOOM-CONTROL-1.3 UIC-ZOOM-CONTROL-1.4 requests levels from the buttons and the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    const control = page.locator('[data-lab-case="requested"]');
    const applied = control.locator('[data-lab-output="zoom"]');
    await control.getByRole('button', { name: 'Zoom in' }).click();
    await expect(applied).toHaveText('125');
    const slider = control.getByRole('slider', { name: 'Zoom level' });
    await slider.focus();
    await page.keyboard.press('End');
    await expect(applied).toHaveText('200');
    await expect(slider).toHaveAttribute('aria-valuetext', '200%');
    await page.keyboard.press('ArrowLeft');
    await expect(applied).toHaveText('150');
    await page.keyboard.press('Home');
    await expect(applied).toHaveText('50');

    const zoomOut = control.getByRole('button', { name: 'Zoom out' });
    await expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    await control.getByRole('button', { name: 'Zoom in' }).click();
    await zoomOut.focus();
    await page.keyboard.press('Enter');
    await expect(applied).toHaveText('50');
    await expect(zoomOut).toBeFocused();
    await expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    await control.getByRole('button', { name: 'Reset zoom' }).click();
    await expect(applied).toHaveText('100');
    await expect(control.locator('[data-lab-output="log"]')).toHaveText('150, 50, 75, 50, 100');
  });

  test('UIC-ZOOM-CONTROL-1.7 disables the whole control and stays accessible', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    const disabled = page.locator('[data-lab-cell="state=disabled size=md"]');
    await expect(disabled.getByRole('slider')).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    await expect(
      page.locator('[data-lab-cell="state=last level size=md"]').getByRole('button', {
        name: 'Zoom in',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
    await lab.expectAccessible();
  });
});
