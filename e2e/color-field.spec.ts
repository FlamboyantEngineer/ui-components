import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, layout = 'label-control'): Locator {
  return page.locator(`[data-lab-cell="state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Color Field lab', () => {
  test('UIC-COLOR-FIELD-1.2 shows a swatch and the colour text for each state and format', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const trigger = cell(page, 'resting').locator('.ui-color-field__trigger');
    await expect(trigger).toHaveAccessibleName('Accent #336699');
    expect((await trigger.boundingBox())?.height).toBe(28);
    await expect(cell(page, 'resting').locator('.ui-color-swatch')).toHaveCSS(
      'background-color',
      'rgb(51, 102, 153)',
    );
    await expect(cell(page, 'required').locator('.ui-color-field__value')).toHaveText('No color');
    await expect(
      field(page, 'placeholder').locator('.ui-color-field__trigger'),
    ).toHaveAccessibleName('Border Same as the text');
    await expect(cell(page, 'read-only').locator('.ui-color-field__trigger')).toBeDisabled();
    await expect(page.locator('[data-lab-cell="format=rgb"] .ui-color-field__value')).toHaveText(
      'rgb(51, 102, 153)',
    );
    await expect(page.locator('[data-lab-cell="format=hsb"] .ui-color-field__value')).toHaveText(
      'hsb(210, 66.67%, 60%)',
    );
    await lab.expectAccessible();
  });

  test('UIC-COLOR-FIELD-1.3 UIC-COLOR-FIELD-2.1 picks in the popover and commits on close', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const picking = field(page, 'picking');
    const trigger = picking.locator('.ui-color-field__trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Marker' });
    await expect(dialog).toBeVisible();
    const popover = await page.locator('.ui-color-field__popover').boundingBox();
    const anchor = await trigger.boundingBox();
    expect(popover?.y).toBeGreaterThan((anchor?.y ?? 0) + (anchor?.height ?? 0));
    expect((await page.locator('.ui-color-field__area').boundingBox())?.width).toBe(192);
    await lab.expectAccessible('.ui-color-field__popover');

    await dialog.getByRole('slider', { name: 'Hue' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(output(page, 'Changed')).toHaveText(/^#[0-9a-f]{6}$/);
    await expect(output(page, 'Committed')).toHaveText('none');
    const hex = dialog.getByRole('textbox', { name: 'Hex color' });
    await hex.fill('#FF8800');
    await hex.press('Enter');
    await expect(output(page, 'Changed')).toHaveText('#ff8800');
    await expect(hex).toBeFocused();
    await expect(hex).toHaveValue('#FF8800');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(output(page, 'Committed')).toHaveText('#ff8800');
    await expect(trigger).toHaveAccessibleName('Marker #FF8800');
  });

  test('UIC-COLOR-FIELD-2.2 clears an optional colour and keeps a required one', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const trigger = field(page, 'picking').locator('.ui-color-field__trigger');
    await trigger.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Clear' }).click();
    await expect(output(page, 'Committed')).toHaveText('empty');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toHaveAccessibleName('Marker No color');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(trigger).toHaveAccessibleName('Marker #2E8B57');
    await page.keyboard.press('Backspace');
    await expect(trigger).toHaveAccessibleName('Marker No color');

    const required = field(page, 'required').locator('.ui-color-field__trigger');
    await required.focus();
    await page.keyboard.press('Delete');
    await expect(required).toHaveAccessibleName('Highlight #FFD700');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Clear' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('UIC-COLOR-FIELD-2.3 restores, undoes and sets the default from the field menu', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const dirty = field(page, 'dirty');
    const trigger = dirty.locator('.ui-color-field__trigger');
    await dirty.getByRole('button', { name: 'Theme actions' }).click();
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(trigger).toHaveAccessibleName('Theme #000000');
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await dirty.getByRole('button', { name: 'Restore Theme' }).click();
    await expect(trigger).toHaveAccessibleName('Theme #336699');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(trigger).toHaveAccessibleName('Theme #000000');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved')).toHaveText('#000000');
  });

  test('UIC-COLOR-FIELD-1.3 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('color-field', { theme: 'dark' });
    await field(page, 'picking').locator('.ui-color-field__trigger').click();
    await expect(page.locator('.ui-color-field__popover')).toHaveCSS(
      'background-color',
      'rgb(33, 40, 48)',
    );
    await lab.expectAccessible('.ui-color-field__popover');
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
  });
});
