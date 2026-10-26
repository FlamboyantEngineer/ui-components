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
    await segmented.getByRole('radio', { name: 'Inherited' }).click();
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
  test('UIC-BOOLEAN-FIELD-3.1 UIC-BOOLEAN-FIELD-3.4 picks from the dropdown with the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field');
    const resting = cell(page, 'dropdown', 'resting');
    const trigger = resting.getByRole('button', { name: 'True Ripe' });
    await expect(trigger).toHaveCSS('height', '28px');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveText(['True', 'False']);
    await lab.expectAccessible('.ui-select-field__popover');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(resting.locator('.ui-field')).toHaveAttribute('data-value', 'false');
    await expect(resting.getByRole('button', { name: 'False Ripe' })).toBeFocused();
    await expect(
      cell(page, 'dropdown', 'dirty').locator('.ui-select-field__previous del'),
    ).toHaveText('True');
    await expect(
      cell(page, 'dropdown', 'read-only').locator('.ui-select-field__trigger'),
    ).toHaveCSS('border-top-style', 'dashed');

    await field(page, 'unset-dropdown').getByRole('button').first().click();
    await expect(listbox.getByRole('option')).toHaveText(['Inherited', 'True', 'False']);
    await listbox.getByRole('option', { name: 'True' }).click();
    await expect(output(page, 'Value')).toHaveText('true');
    await expect(field(page, 'dropdown-labels').getByRole('button').first()).toHaveAccessibleName(
      'Express Delivery',
    );
  });

  test('UIC-BOOLEAN-FIELD-3.2 UIC-BOOLEAN-FIELD-3.3 presses the toggle button at a fixed width', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field');
    const toggle = field(page, 'toggle-labels').locator('.ui-boolean-field__toggle-button');
    await expect(toggle).toHaveAccessibleName('Off Night mode');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveText('Off');
    await expect(toggle.locator('.ui-boolean-field__caption')).toHaveCSS(
      '--ui-boolean-field-caption-width',
      /\d+px/,
    );
    const before = await toggle.boundingBox();
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveText('Enabled');
    const after = await toggle.boundingBox();
    expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(0.5);
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    const cycling = field(page, 'unset-toggle-button').getByRole('button').first();
    await expect(cycling).toHaveText('Inherited');
    await cycling.click();
    await expect(output(page, 'Value')).toHaveText('true');
    const locked = cell(page, 'toggle-button', 'read-only').getByRole('button', {
      name: 'True Ripe',
    });
    await locked.click();
    await expect(locked).toHaveAttribute('aria-pressed', 'true');
    await expect(
      cell(page, 'toggle-button', 'disabled').getByRole('button', { name: 'True Ripe' }),
    ).toBeDisabled();
  });

  test('UIC-BOOLEAN-FIELD-2.3 UIC-BOOLEAN-FIELD-3.4 shows, restores and saves a dirty toggle button', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field');
    const dirty = field(page, 'dirty-toggle');
    const toggle = dirty.locator('.ui-boolean-field__toggle-button');
    await expect(toggle).toHaveAccessibleName('Stale Fresh');
    await toggle.click();
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await expect(dirty.locator('.ui-boolean-field__previous del')).toHaveText('Stale');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved fresh')).toHaveText('true');
    await expect(dirty).not.toHaveAttribute('data-dirty');
    await lab.expectAccessible();
  });

  test('UIC-BOOLEAN-FIELD-3.1 UIC-BOOLEAN-FIELD-3.2 pass axe in the dark theme, with the list open', async ({
    page,
    lab,
  }) => {
    await lab.open('boolean-field', { theme: 'dark' });
    await expect(
      field(page, 'toggle-labels').locator('.ui-boolean-field__toggle-button'),
    ).toHaveCSS('border-top-style', 'solid');
    await cell(page, 'dropdown', 'resting').getByRole('button', { name: 'True Ripe' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await lab.expectAccessible('.ui-select-field__popover');
  });
});

test('UIC-BOOLEAN-FIELD-3.5 UIC-SEGMENTED-CHOICE-1.3 keeps the False label glyphs inside the segmented label', async ({
  page,
  lab,
}) => {
  await lab.open('boolean-field');
  const label = cell(page, 'segmented', 'resting').locator('.ui-segmented-choice__label', {
    hasText: 'False',
  });
  await expect(async () => {
    const fits = await label.evaluate((element) => {
      const style = getComputedStyle(element);
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('No 2D canvas context.');
      context.font = style.font;
      const text = context.measureText(element.textContent ?? '');
      const width = element.getBoundingClientRect().width;
      return (
        text.actualBoundingBoxRight + parseFloat(style.paddingLeft) <= width &&
        text.actualBoundingBoxLeft <= parseFloat(style.paddingLeft)
      );
    });
    expect(fits).toBe(true);
  }).toPass();
});
