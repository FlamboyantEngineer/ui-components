import type { Page } from '@playwright/test';
import { expect, matrix, matrixCell, test } from './fixtures.js';

const section = (page: Page, title: string) =>
  matrix(page, 'modal-controller').locator(`[data-lab-section="${title}"]`);
const output = (page: Page, name: string) =>
  matrix(page, 'modal-controller').locator(`[data-lab-output="${name}"]`);

test.describe('Modal Controller lab coverage', () => {
  test('UIC-MODAL-24.2 UIC-MODAL-24.4 UIC-MODAL-25.4 a render entry answers, updates and leaves at once', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const area = section(page, 'Drawn by render');
    await area.getByRole('button', { name: 'Pick a color' }).click();
    let dialog = page.getByRole('dialog', { name: 'Pick a color (2 shown)' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Show more colors' }).click();
    dialog = page.getByRole('dialog', { name: 'Pick a color (4 shown)' });
    await dialog.getByRole('button', { name: 'Amber' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(output(page, 'Picked color')).toHaveText('Amber');
    await expect(output(page, 'After closing')).toHaveText('render entry: gone');

    await area.getByRole('button', { name: 'Pick a color' }).click();
    await expect(page.getByRole('dialog', { name: 'Pick a color (2 shown)' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(output(page, 'Picked color')).toHaveText('dismissed');

    await area.getByRole('button', { name: 'Open a content entry' }).click();
    await page
      .getByRole('dialog', { name: 'A content entry' })
      .getByRole('button', { name: 'Done' })
      .click();
    await expect(output(page, 'Content exits')).toHaveText('1');
    await expect(output(page, 'After closing')).toContainText('content entry:');
  });

  test('UIC-MODAL-24.5 a subscription follows opening, updating and closing', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const area = section(page, 'Subscribing to the controller');
    await area.getByRole('button', { name: 'Open, update and close' }).click();
    await expect(output(page, 'Open modals')).toHaveText('1: Apples');
    await expect(output(page, 'Subscription log')).toHaveText(
      'Apples; Apples and Pears; Apples and Ripe pears; Apples; none',
    );
    await expect(output(page, 'Open modals')).toHaveText('0');
  });

  test('UIC-MODAL-24.2 opens every tone of the Modal scale', async ({ page, lab }) => {
    await lab.open('modal');
    for (const tone of ['info', 'success', 'warning']) {
      await matrixCell(matrix(page, 'modal-controller'), `tone=${tone} size=sm`)
        .getByRole('button')
        .click();
      const modal = page.locator(`[data-lab-modal="${tone}-sm"]`);
      await expect(modal).toHaveAttribute('data-tone', tone);
      await page.keyboard.press('Escape');
      await expect(modal).toHaveCount(0);
    }
  });
});
