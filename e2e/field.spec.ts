import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, layout: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
}

test.describe('Field lab', () => {
  test('UIC-FIELD-1.12 fits compact text and select fields in a row of small buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const compact = page.locator('[data-lab-filter-row="compact"]');
    const roomy = page.locator('[data-lab-filter-row="default"]');
    const apply = await box(compact.getByRole('button', { name: 'Apply' }));
    for (const name of ['Search', 'Owner']) {
      const fieldBox = await box(
        compact.locator('.ui-field').filter({ has: page.getByRole('textbox', { name }) }),
      );
      expect(fieldBox.height, name).toBeLessThanOrEqual(apply.height + 1);
      expect(Math.abs(fieldBox.y - apply.y), name).toBeLessThanOrEqual(1);
    }
    const roomyOwner = await box(roomy.locator('.ui-field').nth(2));
    expect(roomyOwner.height).toBeGreaterThan(apply.height + 8);

    const status = compact.locator('.ui-field').nth(1);
    expect((await box(status)).height).toBeLessThanOrEqual(apply.height + 1);
    await status.getByRole('button').first().click();
    await page.getByRole('option', { name: 'Open' }).click();
    await expect(status).toHaveAttribute('data-dirty', 'true');
    await expect(status.getByRole('button', { name: 'Restore Status' })).toBeVisible();
    expect((await box(status)).height).toBeLessThanOrEqual(apply.height + 1);

    const owner = compact.locator('.ui-field').nth(2);
    const ownerWidth = (await box(owner)).width;
    await owner.getByRole('textbox', { name: 'Owner' }).fill('Maria 2');
    await expect(owner.locator('.ui-field__message')).toHaveText('Names have no digits.');
    expect((await box(owner)).height).toBeGreaterThan(apply.height + 4);
    expect((await box(owner)).width).toBeLessThanOrEqual(ownerWidth + 30);
    await owner.getByRole('button', { name: 'Restore Owner' }).press('Enter');
    await expect(owner.locator('.ui-field__message')).toBeEmpty();

    const narrow = page.locator('[data-lab-filter-row="compact-narrow"]');
    const row = await box(narrow);
    for (const part of await narrow.locator('.ui-field, .ui-button').all()) {
      const rect = await box(part);
      expect(rect.x + rect.width).toBeLessThanOrEqual(row.x + row.width + 1);
    }
  });

  test('UIC-FIELD-1.1 UIC-FIELD-1.2 places the label for each layout and names the control', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const stacked = cell(page, 'resting', 'label-control');
    const label = await box(stacked.locator('.ui-field__label'));
    const input = await box(stacked.getByRole('textbox', { name: 'Fruit' }));
    expect(label.y + label.height).toBeLessThanOrEqual(input.y);

    const colon = cell(page, 'resting', 'label-colon-control');
    await expect(colon.locator('.ui-field__colon')).toHaveText(':');
    const colonLabel = await box(colon.locator('.ui-field__label'));
    const colonInput = await box(colon.getByRole('textbox', { name: 'Fruit' }));
    expect(colonLabel.x + colonLabel.width).toBeLessThanOrEqual(colonInput.x);
    expect(
      Math.abs(colonLabel.y + colonLabel.height / 2 - (colonInput.y + colonInput.height / 2)),
    ).toBeLessThan(2);

    const after = cell(page, 'resting', 'control-label');
    const afterInput = await box(after.getByRole('textbox', { name: 'Fruit' }));
    expect(afterInput.x + afterInput.width).toBeLessThanOrEqual(
      (await box(after.locator('.ui-field__label'))).x,
    );

    const only = cell(page, 'resting', 'control-only');
    await expect(only.locator('.ui-field__label')).toHaveCount(0);
    await expect(only.getByRole('textbox', { name: 'Fruit' })).toBeVisible();
    await stacked.locator('.ui-field__label').click();
    await expect(stacked.getByRole('textbox')).toBeFocused();
  });

  test('UIC-FIELD-3.2 shows each status with its message', async ({ page, lab }) => {
    await lab.open('field');
    const expected = [
      ['required', 'invalid', 'A value is required.', 'rgb(207, 34, 46)'],
      ['invalid', 'invalid', 'A stone is not a fruit.', 'rgb(207, 34, 46)'],
      ['warning', 'warning', 'Limes are very sour.', 'rgb(154, 103, 0)'],
      ['pending', 'pending', 'Validating', 'rgb(89, 99, 110)'],
    ] as const;
    for (const [state, status, message, colour] of expected) {
      const target = cell(page, state, 'label-control');
      await expect(target.locator('.ui-field')).toHaveAttribute('data-validation', status);
      await expect(target.locator('.ui-field__message')).toHaveText(message);
      await expect(target.locator('.ui-field__message')).toHaveCSS('color', colour);
    }
    // The empty message keeps its line, so a status never moves what follows the field.
    const resting = cell(page, 'resting', 'label-control').locator('.ui-field__message');
    const invalid = cell(page, 'invalid', 'label-control').locator('.ui-field__message');
    expect((await box(resting)).height).toBe((await box(invalid)).height);
    await lab.expectAccessible();
  });

  test('UIC-FIELD-1.4 UIC-FIELD-1.6 shows the help on hover and describes the control with the decoration', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const parts = field(page, 'parts');
    await expect(parts.getByRole('textbox', { name: 'Variety' })).toHaveAccessibleDescription(
      'The apple variety grown in this orchard. Imported',
    );
    await expect(parts.locator('.ui-field__decoration .ui-badge')).toHaveText('Imported');
    // Keyboard focus opens the tooltip at once: the input, then the restore button, then help.
    await parts.getByRole('textbox').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(parts.getByRole('button', { name: 'Help for Variety' })).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Varieties are listed in the orchard catalogue.',
    );
  });

  test('UIC-FIELD-4.1 restores the committed value and keeps focus on the control', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const section = page.locator('[data-lab-section="Dirty and restore"]');
    const input = section.getByRole('textbox', { name: 'Favourite fruit' });
    await input.fill('Apples');
    await expect(section.locator('.ui-field')).toHaveAttribute('data-dirty', 'true');
    await section.getByRole('button', { name: 'Restore Favourite fruit' }).click();
    await expect(input).toHaveValue('Apple');
    await expect(input).toBeFocused();
    await expect(section.getByRole('button', { name: 'Restore Favourite fruit' })).toHaveCount(0);

    await input.fill('Pear');
    await page.keyboard.press('Tab');
    await expect(section.getByRole('button', { name: 'Restore Favourite fruit' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Apple');
    await expect(input).toBeFocused();

    await input.fill('Plum');
    await section.getByRole('button', { name: 'Save' }).click();
    await expect(section.locator('[data-lab-output="Committed"]')).toHaveText('Plum');
    await expect(section.locator('.ui-field')).not.toHaveAttribute('data-dirty');
  });

  test('UIC-FIELD-5.2 UIC-FIELD-5.3 undoes and redoes only the focused field', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const fruit = field(page, 'fruit').getByRole('textbox', { name: 'Fruit' });
    const city = field(page, 'city').getByRole('textbox', { name: 'City' });
    await fruit.fill('Figs');
    await city.fill('Oslox');
    await fruit.focus();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(fruit).toHaveValue('Fig');
    await expect(city).toHaveValue('Oslox');
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(fruit).toHaveValue('Figs');

    await city.focus();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(city).toHaveValue('Oslo');
    await expect(city).toBeFocused();
    await expect(fruit).toHaveValue('Figs');
    await expect(page.locator('[data-lab-output="Toolbar"]')).toHaveText('undo city');
    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(city).toHaveValue('Oslox');
    await expect(fruit).toHaveValue('Figs');
  });

  test('UIC-FIELD-6.3 UIC-FIELD-6.4 opens the field menu from a right click, the keyboard and its button', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const menuField = field(page, 'menu');
    const input = menuField.getByRole('textbox', { name: 'Fruit' });
    const output = page.locator('[data-lab-output="Menu"]');
    await menuField.locator('.ui-field__label').click({ button: 'right' });
    await expect(page.getByRole('menu', { name: 'Fruit actions' })).toBeVisible();
    await lab.expectAccessible('.ui-menu-popover');
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(input).toHaveValue('');
    await expect(output).toHaveText('clear');

    await input.focus();
    await page.keyboard.press('Shift+F10');
    // Clear is disabled once the field is empty, so focus starts on the next entry.
    await expect(page.getByRole('menuitem', { name: 'Set to default' })).toBeFocused();
    await expect(page.getByRole('menuitem', { name: 'Clear' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await page.keyboard.press('Escape');
    await expect(input).toBeFocused();

    await menuField.getByRole('button', { name: 'Fruit actions' }).click();
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(input).toHaveValue('Apple');
    await expect(output).toHaveText('set-default');
    // Focus is back on the field's menu button, inside the field, so the chord undoes it.
    await expect(menuField.getByRole('button', { name: 'Fruit actions' })).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(input).toHaveValue('');
  });

  test('UIC-FIELD-3.2 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('field', { theme: 'dark' });
    await expect(cell(page, 'invalid', 'label-control').locator('.ui-field__message')).toHaveCSS(
      'color',
      'rgb(255, 123, 114)',
    );
    await lab.expectAccessible();
  });

  test('UIC-FIELD-3.7 UIC-FIELD-1.9 shows a required field message when its mode allows', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const mode = (name: string) => page.locator(`[data-lab-cell="mode=${name}"]`);
    await expect(mode('immediate').getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    const blur = mode('blur');
    await blur.getByRole('textbox').focus();
    await expect(blur.locator('.ui-field')).toHaveAttribute('data-focused', 'true');
    await expect(blur.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    await page.keyboard.press('Tab');
    await expect(blur.locator('.ui-field')).toHaveAttribute('data-touched', 'true');
    await expect(blur.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    const submit = mode('submit');
    await submit.getByRole('textbox').fill('a');
    await expect(submit.locator('.ui-field')).toHaveAttribute('data-filled', 'true');
    await submit.getByRole('textbox').fill('');
    await expect(submit.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    await submit.getByRole('button', { name: 'Show messages' }).click();
    await expect(submit.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  test('UIC-FIELD-1.9 UIC-FIELD-3.7 stays untouched while focus moves between its parts and its menu', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const parts = field(page, 'blur-parts');
    const input = parts.getByRole('textbox', { name: 'Town' });
    await input.focus();
    await page.keyboard.press('Tab');
    await expect(parts.getByRole('button', { name: 'Help for Town' })).toBeFocused();
    await page.keyboard.press('Tab');
    const menuButton = parts.getByRole('button', { name: 'Town actions' });
    await expect(menuButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Help' })).toBeFocused();
    await expect(parts).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('Escape');
    await expect(menuButton).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
    await expect(parts).toHaveAttribute('data-focused', 'true');
    await expect(parts).not.toHaveAttribute('data-touched');
    await expect(parts).toHaveAttribute('data-validation', 'valid');
    await input.blur();
    await expect(parts).not.toHaveAttribute('data-focused');
    await expect(parts).toHaveAttribute('data-touched', 'true');
    await expect(parts).toHaveAttribute('data-validation', 'invalid');
  });

  test('UIC-FIELD-3.5 UIC-FIELD-3.6 lists every issue in the message', async ({ page, lab }) => {
    await lab.open('field');
    const issues = field(page, 'issues');
    await expect(issues.locator('.ui-field__message li')).toHaveText([
      'Use 8 characters or more.',
      'Add a digit.',
      'A capital helps.',
    ]);
    await issues.getByRole('textbox').fill('abcdefgh1');
    await expect(issues.locator('.ui-field__message li')).toHaveText(['A capital helps.']);
    await expect(issues).toHaveAttribute('data-validation', 'warning');
  });

  test('UIC-FIELD-3.8 checks a value once it settles and reports the answer', async ({
    page,
    lab,
  }) => {
    // The check waits 300 ms and answers after 500 ms; a paused clock keeps each step observable.
    await page.clock.install();
    await lab.open('field');
    const handle = field(page, 'async');
    const input = handle.getByRole('textbox', { name: 'Handle' });
    await expect(handle).toHaveAttribute('data-validation', 'valid');
    await page.clock.pauseAt(Date.now() + 1000);
    await input.fill('ada');
    await expect(handle).toHaveAttribute('data-validation', 'pending');
    await expect(handle.locator('.ui-field__message')).toHaveText('Validating');
    await page.clock.runFor(799);
    await expect(handle).toHaveAttribute('data-validation', 'pending');
    await page.clock.runFor(1);
    await expect(handle).toHaveAttribute('data-validation', 'invalid');
    await expect(handle.locator('.ui-field__message')).toHaveText('ada is taken.');
  });

  test('UIC-FIELD-3.8 checks a returning value and a replacement validator again', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('field');
    const handle = field(page, 'async');
    const input = handle.getByRole('textbox', { name: 'Handle' });
    await expect(handle).toHaveAttribute('data-validation', 'valid');
    await page.clock.pauseAt(Date.now() + 1000);
    await input.press('End');
    await input.press('a');
    await input.press('Backspace');
    await expect(input).toHaveValue('lin');
    await expect(handle).toHaveAttribute('data-validation', 'pending');
    await page.clock.runFor(800);
    await expect(handle).toHaveAttribute('data-validation', 'valid');
    await page.getByRole('checkbox', { name: 'Reserve short handles' }).check();
    await expect(handle).toHaveAttribute('data-validation', 'pending');
    await page.clock.runFor(800);
    await expect(handle).toHaveAttribute('data-validation', 'invalid');
    await expect(handle.locator('.ui-field__message')).toHaveText('Short handles are reserved.');
  });

  test('UIC-FIELD-2.1 sends edits to the shown record while the next one loads', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    await page.getByRole('button', { name: 'Load South' }).click();
    await expect(page.locator('[data-lab-output="Loading"]')).toHaveText('yes');
    const north = page.getByRole('textbox', { name: 'North fruit' });
    await north.fill('Pear');
    await expect(page.locator('[data-lab-output="Edited"]')).toHaveText('North');
    await expect(north).toHaveValue('Pear');
    await expect(page.getByRole('textbox', { name: 'South fruit' })).toHaveValue('Quince', {
      timeout: 5000,
    });
  });
});
