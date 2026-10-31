import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

/** Whether the element sits in content a modal has made inert or hidden from assistive technology. */
const isBlocked = (locator: Locator) =>
  locator.evaluate((node) => node.closest('[inert], [aria-hidden="true"]') !== null);

test.describe('Modal Controller lab', () => {
  test('UIC-MODAL-CONTROLLER-1.2 UIC-MODAL-CONTROLLER-2.1 opens each tone and size through the host', async ({
    page,
    lab,
  }) => {
    await lab.open('modal-controller');
    for (const tone of ['neutral', 'danger']) {
      for (const size of ['sm', 'md', 'lg', 'xl', 'full']) {
        const button = page.locator(`[data-lab-cell="tone=${tone} size=${size}"] button`);
        await button.click();
        const overlay = page.locator(`.ui-modal[data-lab-modal="${tone}-${size}"]`);
        await expect(overlay).toHaveAttribute('data-size', size);
        await expect(overlay).toHaveAttribute('data-tone', tone);
        await expect(page.getByRole('dialog')).toHaveAccessibleName(
          `Report.pdf (${tone}, ${size})`,
        );
        await page.getByRole('button', { name: tone === 'danger' ? 'Delete' : 'Apply' }).click();
        await expect(overlay).toHaveCount(0);
        await expect(button).toBeFocused();
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-MODAL-CONTROLLER-1.3 UIC-MODAL-CONTROLLER-1.4 resolves results and applies updates', async ({
    page,
    lab,
  }) => {
    await lab.open('modal-controller');
    await page.locator('[data-lab-open="colour"]').click();
    await page.getByRole('button', { name: 'Plum' }).click();
    await expect(page.locator('[data-lab-output="colour"]')).toHaveText('Plum');
    await page.locator('[data-lab-open="colour"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-lab-output="colour"]')).toHaveText('dismissed');

    await page.locator('[data-lab-open="rename"]').click();
    const rename = page.getByRole('button', { name: 'Rename', exact: true });
    await expect(rename).toBeDisabled();
    await page.getByRole('textbox', { name: 'New name' }).fill('Summary.pdf');
    await expect(page.getByRole('dialog')).toHaveAccessibleName('Rename to Summary.pdf');
    await expect(rename).toBeEnabled();
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('[data-lab-output="name"]')).toHaveText('Summary.pdf');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('UIC-MODAL-CONTROLLER-2.2 stacks modals and returns focus beneath', async ({
    page,
    lab,
  }) => {
    await lab.open('modal-controller');
    const opener = page.locator('[data-lab-open="stack"]');
    await opener.click();
    await expect(page.getByRole('dialog', { name: 'Lisbon' })).toBeVisible();
    const another = page.getByRole('button', { name: 'Open another' });
    await another.click();
    await expect(page.getByRole('dialog', { name: 'Oslo' })).toBeVisible();
    const lisbon = page.locator('.ui-modal[data-lab-modal="lisbon"]');
    expect(await isBlocked(lisbon)).toBe(true);
    expect(await isBlocked(page.locator('.ui-modal[data-lab-modal="oslo"]'))).toBe(false);
    const centre = await page.evaluate(() => {
      const element = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return element?.closest('[data-lab-modal]')?.getAttribute('data-lab-modal') ?? null;
    });
    expect(centre).toBe('oslo');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Oslo' })).toHaveCount(0);
    await expect(another).toBeFocused();
    await another.click();
    await page
      .locator('.ui-modal[data-lab-modal="oslo"]')
      .getByRole('button', { name: 'Close all' })
      .click();
    await expect(page.locator('.ui-modal')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-CONTROLLER-2.1 shows two modals opened at once, the newest on top', async ({
    page,
    lab,
  }) => {
    await lab.open('modal-controller');
    await page.locator('[data-lab-open="queue"]').click();
    await expect(page.locator('body > .ui-modal')).toHaveCount(2);
    const lisbon = page.locator('.ui-modal[data-lab-modal="lisbon"]');
    const oslo = page.locator('.ui-modal[data-lab-modal="oslo"]');
    await expect(oslo.getByRole('dialog')).toHaveAccessibleName('Oslo');
    await expect(oslo.getByRole('button', { name: 'Open another' })).toBeFocused();
    expect(await isBlocked(lisbon)).toBe(true);
    expect(await isBlocked(oslo)).toBe(false);
    await lab.expectAccessible('.ui-modal[data-lab-modal="oslo"]');
    await page.keyboard.press('Escape');
    await expect(oslo).toHaveCount(0);
    await expect(lisbon.getByRole('dialog')).toHaveAccessibleName('Lisbon');
    expect(await isBlocked(lisbon)).toBe(false);
  });

  test('UIC-MODAL-CONTROLLER-1.2 passes an accessibility check in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('modal-controller', { theme: 'dark' });
    await lab.expectAccessible();
    await page.locator('[data-lab-open="colour"]').click();
    await expect(page.getByRole('dialog', { name: 'Pick a colour' })).toBeVisible();
    await lab.expectAccessible('.ui-modal');
  });

  test("UIC-MODAL-CONTROLLER-2.3 shows another controller's modal fresh", async ({ page, lab }) => {
    await lab.open('modal-controller');
    await page.getByRole('button', { name: 'Edit a note, then switch workspace' }).click();
    const north = page.getByRole('dialog', { name: 'North note' });
    await north.getByRole('textbox', { name: 'Note' }).fill('North draft');
    const south = page.getByRole('dialog', { name: 'South note' });
    await expect(south).toBeVisible();
    await expect(south.getByRole('textbox', { name: 'Note' })).toHaveValue('South default');
    await expect(north).toHaveCount(0);
  });
});
