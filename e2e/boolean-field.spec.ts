import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, variant: string, state: string, layout = 'label-control'): Locator {
  return page.locator(`[data-lab-cell="variant=${variant} state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Boolean Field lab', () => {
  test('UIC-BOOLEAN-FIELD-1.2 UIC-BOOLEAN-FIELD-1.4 draws each variant and toggles from the label', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field');
    const checkbox = cell(page, 'checkbox', 'resting').getByRole('checkbox', { name: 'Ripe' });
    await expect(checkbox).toBeChecked();
    await cell(page, 'checkbox', 'resting').locator('.ui-field__label').click();
    await expect(checkbox).not.toBeChecked();

    const switchCell = cell(page, 'switch', 'resting');
    const toggle = switchCell.getByRole('switch', { name: 'Ripe' });
    await expect(toggle).toBeChecked();
    const track = switchCell.locator('.ui-boolean-field__track');
    const thumb = switchCell.locator('.ui-boolean-field__thumb');
    const on = await thumb.boundingBox();
    const box = await track.boundingBox();
    expect((on?.x ?? 0) - (box?.x ?? 0)).toBeGreaterThan((box?.width ?? 0) / 2);
    await switchCell.locator('.ui-field__label').click();
    await expect(toggle).not.toBeChecked();
    await expect(async () => {
      const off = await thumb.boundingBox();
      expect((off?.x ?? 0) - (box?.x ?? 0)).toBeLessThan((box?.width ?? 0) / 2);
    }).toPass();

    const segmented = cell(page, 'segmented', 'resting');
    await expect(segmented.getByRole('radiogroup', { name: 'Ripe' })).toBeVisible();
    await expect(segmented.getByRole('radio', { name: 'True' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(cell(page, 'checkbox', 'required').getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await lab.expectAccessible();
  });

  test('UIC-BOOLEAN-FIELD-2.1 UIC-BOOLEAN-FIELD-2.2 toggles with Space and cycles back to unset', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field');
    const checkbox = field(page, 'unset-checkbox').getByRole('checkbox');
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(output(page, 'Value')).toHaveText('true');
    await page.keyboard.press('Space');
    await expect(output(page, 'Value')).toHaveText('false');
    await page.keyboard.press('Space');
    await expect(output(page, 'Value')).toHaveText('unset');
    await expect(field(page, 'unset-switch').locator('.ui-boolean-field__caption')).toHaveText(
      'Inherited',
    );
    const segmented = field(page, 'unset-segmented');
    await segmented.getByRole('radio', { name: 'False' }).click();
    await expect(output(page, 'Value')).toHaveText('false');
    await segmented.getByRole('radio', { name: 'False' }).click();
    await expect(output(page, 'Value')).toHaveText('unset');
    await expect(field(page, 'captioned').locator('.ui-boolean-field__caption')).toHaveText('No');
  });

  test('UIC-BOOLEAN-FIELD-2.3 refuses presses while read-only, undoes and restores', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field');
    const locked = cell(page, 'switch', 'read-only').getByRole('switch');
    await locked.click({ force: true });
    await expect(locked).toBeChecked();

    const dirty = field(page, 'dirty');
    const checkbox = dirty.getByRole('checkbox', { name: 'Ripe' });
    await dirty.locator('.ui-checkbox__box').click();
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(checkbox).not.toBeChecked();
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(checkbox).toBeChecked();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved')).toHaveText('true');
    await expect(dirty).not.toHaveAttribute('data-dirty');
  });

  test('UIC-BOOLEAN-FIELD-1.4 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('boolean-field', { theme: 'dark' });
    await expect(cell(page, 'switch', 'resting').locator('.ui-boolean-field__track')).toHaveCSS(
      'background-color',
      'rgb(31, 111, 235)',
    );
    await lab.expectAccessible();
  });
});
