import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

function cell(page: Page, state: string, value: string): Locator {
  return matrixCell(page, `state=${state} value=${value}`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Checkbox lab', () => {
  test('UIC-CHECKBOX-1.1 UIC-CHECKBOX-1.3 draws a 16 pixel box with a tick or a dash', async ({
    page,
    lab,
  }) => {
    await lab.open('checkbox');
    const box = await cell(page, 'resting', 'empty').locator('.ui-checkbox__box').boundingBox();
    expect(box?.width).toBe(16);
    expect(box?.height).toBe(16);
    await expect(cell(page, 'resting', 'ticked').locator('.ui-checkbox__glyph')).toHaveAttribute(
      'data-glyph',
      'check',
    );
    await expect(cell(page, 'resting', 'mixed').getByRole('checkbox')).toBeChecked({
      indeterminate: true,
    });
    await expect(cell(page, 'invalid', 'empty').getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(cell(page, 'invalid', 'empty').locator('.ui-checkbox__box')).toHaveCSS(
      'border-top-color',
      'rgb(207, 34, 46)',
    );
    await expect(page.getByRole('checkbox', { name: 'Select the Apple row' })).toBeChecked();
    await lab.expectAccessible();
  });

  test('UIC-CHECKBOX-1.2 toggles from the label and Space, and not while locked', async ({
    page,
    lab,
  }) => {
    await lab.open('checkbox');
    await page.getByText('Match case').click();
    await expect(output(page, 'Options')).toHaveText('case');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('checkbox', { name: 'Whole word' })).toBeFocused();
    await expect(page.locator('[data-lab-field="case"]')).not.toHaveAttribute('data-focus-visible');
    await page.keyboard.press('Space');
    await expect(output(page, 'Options')).toHaveText('case, word');

    const locked = cell(page, 'read-only', 'ticked');
    await locked.locator('.ui-checkbox__label').click();
    await expect(locked.getByRole('checkbox')).toBeChecked();
    await expect(cell(page, 'disabled', 'empty').getByRole('checkbox')).toBeDisabled();
  });

  test('UIC-CHECKBOX-1.3 rings the box on keyboard focus', async ({ page, lab }) => {
    await lab.open('checkbox');
    const option = page.locator('[data-lab-field="case"]');
    await option.getByRole('checkbox').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(option).toHaveAttribute('data-focus-visible', 'true');
    await expect(option.locator('.ui-checkbox__box')).toHaveCSS('outline-style', 'solid');
  });

  test('UIC-CHECKBOX-2.1 cycles three states', async ({ page, lab }) => {
    await lab.open('checkbox');
    const box = page.locator('[data-lab-field="three-state"]');
    const input = box.getByRole('checkbox', { name: 'Repeat header row' });
    await expect(input).toBeChecked({ indeterminate: true });
    await box.click();
    await expect(output(page, 'Value')).toHaveText('true');
    await box.click();
    await expect(output(page, 'Value')).toHaveText('false');
    await box.click();
    await expect(output(page, 'Value')).toHaveText('inherited');
  });

  test('UIC-CHECKBOX-1.3 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('checkbox', { theme: 'dark' });
    await expect(cell(page, 'resting', 'ticked').locator('.ui-checkbox__box')).toHaveCSS(
      'background-color',
      'rgb(31, 111, 235)',
    );
    await lab.expectAccessible();
  });

  test('UIC-CHECKBOX-1.1 draws a label of zero and is named by it', async ({ page, lab }) => {
    await lab.open('checkbox');
    const field = page.locator('[data-lab-field="zero"]');
    await expect(field.locator('.ui-checkbox__label')).toHaveText('0');
    await expect(field.getByRole('checkbox', { name: '0', exact: true })).toHaveCount(1);
  });
});
