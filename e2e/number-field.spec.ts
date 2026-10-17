import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, stepper: string, state: string, layout = 'label-control'): Locator {
  return page.locator(`[data-lab-cell="stepper=${stepper} state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Number Field lab', () => {
  test('UIC-NUMBER-FIELD-1.3 frames the input between step buttons that step from the keyboard too', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const resting = cell(page, 'shown', 'resting');
    const input = resting.getByRole('textbox', { name: 'Weight' });
    const group = await resting.locator('.ui-number-field__group').boundingBox();
    const decrement = await resting.locator('.ui-number-field__decrement').boundingBox();
    const increment = await resting.locator('.ui-number-field__increment').boundingBox();
    const box = await input.boundingBox();
    expect(group?.height).toBe(28);
    expect((decrement?.x ?? 0) + (decrement?.width ?? 0)).toBeLessThanOrEqual(box?.x ?? 0);
    expect(increment?.x ?? 0).toBeGreaterThanOrEqual((box?.x ?? 0) + (box?.width ?? 0));

    await resting.getByRole('button', { name: 'Increase Weight' }).click();
    await expect(input).toHaveValue('5');
    await expect(input).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveValue('3');

    const hidden = cell(page, 'hidden', 'resting');
    await expect(hidden.getByRole('button', { name: 'Increase Weight' })).toHaveCount(0);
    await hidden.getByRole('textbox').focus();
    await page.keyboard.press('ArrowUp');
    await expect(hidden.getByRole('textbox')).toHaveValue('5');
    await expect(cell(page, 'shown', 'invalid').getByRole('textbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await lab.expectAccessible();
  });

  test('UIC-NUMBER-FIELD-2.1 UIC-NUMBER-FIELD-2.2 commits on blur, snapping or reporting the value', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const snap = field(page, 'snap').getByRole('textbox', { name: 'Weight' });
    await snap.fill('12');
    await expect(output(page, 'Committed')).toHaveText('2.5');
    await snap.press('Tab');
    await expect(snap).toHaveValue('10');
    await expect(output(page, 'Committed')).toHaveText('10');
    await snap.fill('3.3');
    await snap.press('Enter');
    await expect(snap).toHaveValue('3.5');

    const validate = field(page, 'validate');
    const length = validate.getByRole('textbox', { name: 'Length' });
    await length.fill('12');
    await length.press('Tab');
    await expect(length).toHaveValue('12');
    await expect(validate.locator('.ui-field__message')).toHaveText('Enter 10 or less.');
    await length.fill('1.7');
    await length.press('Tab');
    await expect(validate.locator('.ui-field__message')).toHaveText(
      'Enter a value in steps of 0.5.',
    );
    await length.fill('2.5');
    await length.press('Tab');
    await expect(validate).toHaveAttribute('data-validation', 'valid');
  });

  test('UIC-NUMBER-FIELD-1.2 formats currency, percent and a German unit', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    await expect(field(page, 'currency').getByRole('textbox')).toHaveValue('€1,234.50');
    await expect(field(page, 'percent').getByRole('textbox')).toHaveValue('25%');
    await expect(field(page, 'placeholder').getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'No tip',
    );
    const german = field(page, 'german').getByRole('textbox');
    await expect(german).toHaveValue('1.234,5 km');
    await german.fill('2.000,5');
    await german.press('Tab');
    await expect(german).toHaveValue('2.000,5 km');
  });

  test('UIC-NUMBER-FIELD-2.3 restores, undoes and clears from the field menu', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const dirty = field(page, 'dirty');
    const input = dirty.getByRole('textbox', { name: 'Servings' });
    await dirty.getByRole('button', { name: 'Increase Servings' }).click();
    await expect(input).toHaveValue('5');
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await dirty.getByRole('button', { name: 'Restore Servings' }).click();
    await expect(input).toHaveValue('4');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(input).toHaveValue('5');
    await dirty.getByRole('button', { name: 'Servings actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(input).toHaveValue('');
    await dirty.getByRole('button', { name: 'Servings actions' }).click();
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(input).toHaveValue('2');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved')).toHaveText('2');
  });

  test('UIC-NUMBER-FIELD-1.3 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('number-field', { theme: 'dark' });
    await expect(cell(page, 'shown', 'invalid').locator('.ui-number-field__group')).toHaveCSS(
      'border-top-color',
      'rgb(255, 123, 114)',
    );
    await lab.expectAccessible();
  });

  test('UIC-NUMBER-FIELD-3.1 frames literal affixes and keeps the locale grouping', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const rent = field(page, 'rent');
    const input = rent.getByRole('textbox', { name: 'Rent' });
    await expect(input).toHaveValue('1,250');
    const start = await rent.locator('.ui-number-field__start').boundingBox();
    const box = await input.boundingBox();
    const end = await rent.locator('.ui-number-field__end').boundingBox();
    expect((start?.x ?? 0) + (start?.width ?? 0)).toBeLessThanOrEqual(box?.x ?? 0);
    expect(end?.x ?? 0).toBeGreaterThanOrEqual((box?.x ?? 0) + (box?.width ?? 0));
    await expect(rent.locator('.ui-number-field__end')).toHaveText('/mo');
    await expect(field(page, 'lakh').getByRole('textbox')).toHaveValue('12,50,000');
    await lab.expectAccessible();
  });

  test('UIC-NUMBER-FIELD-3.2 steps by larger and smaller amounts with Shift and Alt', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const input = field(page, 'fast').getByRole('textbox', { name: 'Opacity' });
    await input.focus();
    await page.keyboard.press('Shift+ArrowUp');
    await expect(input).toHaveValue('50');
    await expect(output(page, 'Opacity')).toHaveText('50');
    await page.keyboard.press('Alt+ArrowDown');
    await expect(input).toHaveValue('49.9');
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('50');
  });

  test('UIC-NUMBER-FIELD-3.3 scrubs the value by dragging its handle sideways', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const fast = field(page, 'fast');
    const input = fast.getByRole('textbox', { name: 'Opacity' });
    const scrubber = fast.locator('.ui-number-field__scrubber');
    await scrubber.scrollIntoViewIfNeeded();
    const handle = await scrubber.boundingBox();
    if (!handle) throw new Error('not rendered');
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y, { steps: 4 });
    await expect(input).toHaveValue('45');
    await expect(output(page, 'Opacity')).toHaveText('40');
    await page.mouse.move(x - 4, y, { steps: 2 });
    await expect(input).toHaveValue('39');
    await page.mouse.up();
    await expect(output(page, 'Opacity')).toHaveText('39');
  });
});
