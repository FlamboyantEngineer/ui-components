import type { Locator } from '@playwright/test';
import { expect, matrix, matrixCell, test } from './fixtures.js';

/** Whether the element sits in content a modal has made inert or hidden from assistive technology. */
const isBlocked = (locator: Locator) =>
  locator.evaluate((node) => node.closest('[inert], [aria-hidden="true"]') !== null);

test.describe('Dialog Controller lab', () => {
  test('UIC-DIALOG-24.2 UIC-DIALOG-25.1 opens each tone and size through the host', async ({
    page,
    lab,
  }) => {
    await lab.open('dialog');
    for (const tone of ['neutral', 'danger']) {
      for (const size of ['sm', 'md', 'lg', 'xl', 'full']) {
        const button = matrixCell(
          matrix(page, 'modal-controller'),
          `tone=${tone} size=${size}`,
        ).locator(`button`);
        await button.click();
        const overlay = page.locator(`.ui-dialog[data-lab-modal="${tone}-${size}"]`);
        await expect(overlay).toHaveAttribute('data-size', size);
        await expect(overlay).toHaveAttribute('data-tone', tone);
        await expect(page.getByRole('dialog')).toHaveAccessibleName(
          `Report.pdf (${tone}, ${size})`,
        );
        await overlay
          .getByRole('button', { name: tone === 'danger' ? 'Delete' : 'Apply', exact: true })
          .click();
        await expect(overlay).toHaveCount(0);
        await expect(button).toBeFocused();
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-DIALOG-24.3 UIC-DIALOG-24.4 resolves results and applies updates', async ({
    page,
    lab,
  }) => {
    await lab.open('dialog');
    await matrix(page, 'modal-controller').locator('[data-lab-open="color"]').click();
    await page
      .getByRole('dialog', { name: 'Pick a color', exact: true })
      .getByRole('button', { name: 'Plum', exact: true })
      .click();
    await expect(matrix(page, 'modal-controller').locator('[data-lab-output="color"]')).toHaveText(
      'Plum',
    );
    await matrix(page, 'modal-controller').locator('[data-lab-open="color"]').click();
    await page.keyboard.press('Escape');
    await expect(matrix(page, 'modal-controller').locator('[data-lab-output="color"]')).toHaveText(
      'dismissed',
    );

    await matrix(page, 'modal-controller').locator('[data-lab-open="rename"]').click();
    const renameDialog = page.locator('.ui-dialog[data-lab-modal="rename"]');
    const rename = renameDialog.getByRole('button', { name: 'Rename', exact: true });
    await expect(rename).toBeDisabled();
    await renameDialog.getByRole('textbox', { name: 'New name' }).fill('Summary.pdf');
    await expect(page.getByRole('dialog')).toHaveAccessibleName('Rename to Summary.pdf');
    await expect(rename).toBeEnabled();
    await page.keyboard.press('Control+Enter');
    await expect(matrix(page, 'modal-controller').locator('[data-lab-output="name"]')).toHaveText(
      'Summary.pdf',
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('UIC-DIALOG-25.2 stacks modals and returns focus beneath', async ({ page, lab }) => {
    await lab.open('dialog');
    const opener = matrix(page, 'modal-controller').locator('[data-lab-open="stack"]');
    await opener.click();
    await expect(page.getByRole('dialog', { name: 'Lisbon' })).toBeVisible();
    const another = page.getByRole('button', { name: 'Open another' });
    await another.click();
    await expect(page.getByRole('dialog', { name: 'Oslo' })).toBeVisible();
    const lisbon = page.locator('.ui-dialog[data-lab-modal="lisbon"]');
    expect(await isBlocked(lisbon)).toBe(true);
    expect(await isBlocked(page.locator('.ui-dialog[data-lab-modal="oslo"]'))).toBe(false);
    const centre = await page.evaluate(() => {
      const element = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return element?.closest('[data-lab-modal]')?.getAttribute('data-lab-modal') ?? null;
    });
    expect(centre).toBe('oslo');
    // The page is dimmed once: the modal above takes the weaker scrim.
    const oslo = page.locator('.ui-dialog[data-lab-modal="oslo"]');
    await expect(lisbon).toHaveAttribute('data-stack-index', '0');
    await expect(oslo).toHaveAttribute('data-stack-index', '1');
    const background = (locator: typeof oslo) =>
      locator.evaluate((node) => getComputedStyle(node).backgroundColor);
    const [lower, upper] = [await background(lisbon), await background(oslo)];
    expect(lower).not.toBe(upper);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Oslo' })).toHaveCount(0);
    await expect(another).toBeFocused();
    await another.click();
    await page
      .locator('.ui-dialog[data-lab-modal="oslo"]')
      .getByRole('button', { name: 'Close all' })
      .click();
    await expect(page.locator('.ui-dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-DIALOG-25.1 shows two modals opened at once, the newest on top', async ({
    page,
    lab,
  }) => {
    await lab.open('dialog');
    await matrix(page, 'modal-controller').locator('[data-lab-open="queue"]').click();
    await expect(page.locator('body > .ui-dialog')).toHaveCount(2);
    const lisbon = page.locator('.ui-dialog[data-lab-modal="lisbon"]');
    const oslo = page.locator('.ui-dialog[data-lab-modal="oslo"]');
    await expect(oslo.getByRole('dialog')).toHaveAccessibleName('Oslo');
    await expect(oslo.getByRole('button', { name: 'Open another' })).toBeFocused();
    expect(await isBlocked(lisbon)).toBe(true);
    expect(await isBlocked(oslo)).toBe(false);
    await lab.expectAccessible('.ui-dialog[data-lab-modal="oslo"]');
    await page.keyboard.press('Escape');
    await expect(oslo).toHaveCount(0);
    await expect(lisbon.getByRole('dialog')).toHaveAccessibleName('Lisbon');
    expect(await isBlocked(lisbon)).toBe(false);
  });

  test('UIC-DIALOG-24.2 passes an accessibility check in the dark theme', async ({ page, lab }) => {
    await lab.open('dialog', { theme: 'dark' });
    await lab.expectAccessible();
    await matrix(page, 'modal-controller').locator('[data-lab-open="color"]').click();
    await expect(page.getByRole('dialog', { name: 'Pick a color' })).toBeVisible();
    await lab.expectAccessible('.ui-dialog');
  });

  test("UIC-DIALOG-25.3 shows another controller's modal fresh", async ({ page, lab }) => {
    await lab.open('dialog');
    await page.getByRole('button', { name: 'Edit workspace note' }).click();
    const north = page.getByRole('dialog', { name: 'North note' });
    await north.getByRole('textbox', { name: 'Note' }).fill('North draft');
    await north.getByRole('button', { name: 'Switch to South' }).click();
    const south = page.getByRole('dialog', { name: 'South note' });
    await expect(south).toBeVisible();
    await expect(south.getByRole('textbox', { name: 'Note' })).toHaveValue('South default');
    await expect(north).toHaveCount(0);
  });

  test('UIC-DIALOG-25.4 runs the exit of a closed modal once', async ({ page, lab }) => {
    await lab.open('dialog');
    const demo = matrix(page, 'modal-controller').locator('[data-lab-demo="exits"]');
    const output = demo.locator('[data-lab-output="exits"]');
    for (const [index, close] of [
      async () => page.keyboard.press('Escape'),
      async () => page.getByRole('button', { name: 'Cancel' }).click(),
      async () => page.mouse.click(5, 5),
    ].entries()) {
      await demo.getByRole('button', { name: 'Open a note' }).click();
      await expect(page.getByRole('dialog', { name: 'Harvest note' })).toBeVisible();
      await close();
      await expect(page.getByRole('dialog', { name: 'Harvest note' })).toHaveCount(0);
      await expect(output).toHaveText(String(index + 1));
    }
  });
});
