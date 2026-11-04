import type { Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

/** The outer overlay's scroll state and the panel's box. */
async function frame(page: Page) {
  const overlay = page.locator('.ui-modal[data-lab-modal="tall-form"]');
  const scroll = await overlay.evaluate((node) => ({
    top: node.scrollTop,
    room: node.scrollHeight - node.clientHeight,
  }));
  const panel = requireDefined(await overlay.locator('.ui-modal__panel').boundingBox());
  return { scroll, panel };
}

/** The frame stays put: no outer scroll, the panel inside the viewport, its chrome on screen. */
async function expectFrameInPlace(page: Page) {
  const viewport = requireDefined(page.viewportSize());
  await expect(async () => {
    const { scroll, panel } = await frame(page);
    expect(scroll).toEqual({ top: 0, room: 0 });
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height);
  }).toPass();
  const dialog = page.getByRole('dialog', { name: 'Trip settings' });
  for (const control of [
    dialog.getByRole('heading', { name: 'Trip settings' }),
    dialog.getByRole('button', { name: 'Close' }),
    dialog.getByRole('button', { name: 'Save' }),
  ]) {
    await expect(control).toBeInViewport({ ratio: 1 });
  }
}

for (const theme of ['light', 'dark']) {
  test(`UIC-MODAL-1.7 keeps a tall form's frame in place while fields take focus in the ${theme} theme`, async ({
    page,
    lab,
    isMobile,
  }) => {
    const widths = isMobile ? [390, 320, 390, 320] : [1440, 390, 320];
    const height = 844;
    await page.setViewportSize({ width: requireDefined(widths[0]), height });
    await lab.open('modal', { theme });
    const opener = page.getByRole('button', { name: 'Edit the trip' });
    for (const width of widths) {
      await page.setViewportSize({ width, height });
      await opener.scrollIntoViewIfNeeded();
      await opener.click();
      const dialog = page.getByRole('dialog', { name: 'Trip settings' });
      await expect(dialog).toBeFocused();
      await expectFrameInPlace(page);
      const travellers = dialog.getByRole('textbox', { name: 'Travellers' });
      await travellers.fill('5');
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Restore Travellers' })).toBeFocused();
      await expectFrameInPlace(page);
      await page.keyboard.press('Enter');
      await expect(travellers).toHaveValue('2');
      await page.setViewportSize({ width: width === 320 ? 390 : 320, height });
      await expectFrameInPlace(page);
      await page.setViewportSize({ width, height });
      await dialog.getByRole('button', { name: 'Contacts' }).click();
      const note = dialog.getByRole('textbox', { name: 'Contacts note' });
      await note.focus();
      await expect(note).toBeInViewport();
      await expectFrameInPlace(page);
      const body = dialog.locator('.ui-modal__body');
      expect(await body.evaluate((node) => node.scrollTop > 0)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  });
}
