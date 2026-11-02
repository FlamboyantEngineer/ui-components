import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

/** A 2 × 1 PNG: one opaque dark pixel beside a transparent one. */
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAD0lEQVR42mOQ0Ej4zwAEAAkcAaBuYLc8AAAAAElFTkSuQmCC',
  'base64',
);

function pad(page: Page, value: string, lock = 'editable') {
  return page.locator(`[data-lab-field="menu-${value}-${lock}"]`);
}

function output(page: Page, value: string) {
  return page.locator(`[data-lab-output="menu-${value}"]`);
}

function menuOf(page: Page) {
  return page.getByRole('menu', { name: 'Signature actions' });
}

async function names(page: Page) {
  return menuOf(page).getByRole('menuitem').allTextContents();
}

test.describe('Signature Pad field menu', () => {
  test('UIC-SIGNATURE-PAD-5.1 UIC-SIGNATURE-PAD-5.2 undoes a stroke from the canvas menu and deletes an image', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const drawn = pad(page, 'drawn');
    await drawn.locator('.ui-signature-pad__canvas').click({ button: 'right' });
    expect(await names(page)).toEqual(['Undo stroke', 'Clear', 'Reset']);
    await menuOf(page).getByRole('menuitem', { name: 'Undo stroke' }).click();
    await expect(output(page, 'drawn')).toHaveText('drawn, 1');
    await expect(menuOf(page)).toHaveCount(0);
    // Focus returns to the field's control.
    await expect(drawn.getByRole('img', { name: 'Signature' })).toBeFocused();

    const image = pad(page, 'image');
    await image.locator('.ui-signature-pad__image-preview').click({ button: 'right' });
    expect(await names(page)).toEqual(['Upload image', 'Paste image', 'Delete image', 'Reset']);
    await lab.expectAccessible('[role="menu"]');
    await menuOf(page).getByRole('menuitem', { name: 'Delete image' }).click();
    await expect(output(page, 'image')).toHaveText('none');
  });

  test('UIC-SIGNATURE-PAD-5.1 UIC-SIGNATURE-PAD-5.2 uploads an image into an empty pad from the keyboard menu', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const empty = pad(page, 'empty');
    await empty.getByRole('img', { name: 'Signature' }).focus();
    await page.keyboard.press('Shift+F10');
    expect(await names(page)).toEqual(['Upload image', 'Paste image', 'Clear', 'Reset']);
    const chooser = page.waitForEvent('filechooser');
    await expect(menuOf(page).getByRole('menuitem', { name: 'Upload image' })).toBeFocused();
    await page.keyboard.press('Enter');
    // A cancelled or refused file keeps the pad as it was.
    await (
      await chooser
    ).setFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
    await expect(empty.getByRole('status')).toHaveText('Choose a PNG, JPEG, WebP or GIF image.');
    await expect(output(page, 'empty')).toHaveText('nothing yet');
    await expect(empty).toHaveAttribute('data-mode', 'image');
    // The browser's own contextmenu event right after the key is ignored, so open by key again.
    // Wait for the chooser before opening the menu, so the browser intercepts it by then.
    const again = page.waitForEvent('filechooser');
    await empty.getByRole('img', { name: 'Signature' }).focus();
    await page.keyboard.press('Shift+F10');
    await expect(menuOf(page).getByRole('menuitem', { name: 'Upload image' })).toBeFocused();
    await page.keyboard.press('Enter');
    await (await again).setFiles({ name: 'sign.png', mimeType: 'image/png', buffer: tinyPng });
    await expect(output(page, 'empty')).toHaveText('image');
  });

  test('UIC-SIGNATURE-PAD-5.1 UIC-SIGNATURE-PAD-5.2 opens from a typed name with the keyboard, with no image intake', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    await pad(page, 'typed').getByRole('textbox').focus();
    await page.keyboard.press('Shift+F10');
    expect(await names(page)).toEqual(['Clear', 'Reset']);
    await page.keyboard.press('Escape');
    await expect(pad(page, 'typed').getByRole('textbox')).toBeFocused();
  });

  test('UIC-SIGNATURE-PAD-5.3 disables the pad actions while read-only and opens no menu while disabled', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    await pad(page, 'image', 'read-only')
      .locator('.ui-signature-pad__image-preview')
      .click({ button: 'right' });
    for (const name of ['Upload image', 'Paste image', 'Delete image']) {
      await expect(menuOf(page).getByRole('menuitem', { name })).toBeDisabled();
    }
    await page.keyboard.press('Escape');
    await pad(page, 'drawn', 'disabled')
      .locator('.ui-signature-pad__canvas')
      .click({ button: 'right' });
    await expect(menuOf(page)).toHaveCount(0);
  });
});
