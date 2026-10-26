import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, lines: string, state: string, layout = 'label-control'): Locator {
  return page.locator(`[data-lab-cell="lines=${lines} state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Text Field lab', () => {
  test('UIC-TEXT-FIELD-1.2 UIC-TEXT-FIELD-1.3 draws a framed input or text area for each state', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const input = cell(page, 'single', 'resting').getByRole('textbox', { name: 'Fruit' });
    await expect(input).toHaveValue('Apple');
    expect((await input.boundingBox())?.height).toBe(28);
    const area = cell(page, 'multiline', 'resting').getByRole('textbox', { name: 'Fruit' });
    expect(await area.evaluate((node) => node.tagName)).toBe('TEXTAREA');
    expect((await area.boundingBox())?.height).toBeGreaterThanOrEqual(64);

    const invalid = cell(page, 'single', 'invalid').getByRole('textbox');
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAccessibleDescription('This value is not allowed.');
    await invalid.fill('Pear');
    await expect(invalid).not.toHaveAttribute('aria-invalid');
    await expect(cell(page, 'single', 'read-only').getByRole('textbox')).toHaveAttribute(
      'readonly',
      '',
    );
    await expect(cell(page, 'single', 'disabled').getByRole('textbox')).toBeDisabled();
    await expect(
      cell(page, 'single', 'resting', 'control-only').getByRole('textbox', { name: 'Fruit' }),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-TEXT-FIELD-2.1 UIC-TEXT-FIELD-2.2 commits on Enter and blur and reverts on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const city = field(page, 'commit').getByRole('textbox', { name: 'City' });
    await city.fill('Bergen');
    await expect(output(page, 'Committed')).toHaveText('Oslo');
    await city.press('Enter');
    await expect(output(page, 'Committed')).toHaveText('Bergen');

    await city.pressSequentially('x');
    await city.press('Escape');
    await expect(city).toHaveValue('Bergen');
    await expect(city).toBeFocused();
    await expect(output(page, 'Escape on the surface')).toHaveText('0');
    await city.press('Escape');
    await expect(output(page, 'Escape on the surface')).toHaveText('1');

    const note = field(page, 'note').getByRole('textbox', { name: 'Note' });
    await note.pressSequentially('One');
    await note.press('Enter');
    await note.pressSequentially('Two');
    await expect(output(page, 'Committed')).toHaveText('Bergen');
    // Tab reaches the restore button inside the field; leaving the field commits.
    await note.press('Tab');
    await page.keyboard.press('Tab');
    await expect(output(page, 'Committed')).toHaveText('One Two');
    await expect(note).toHaveValue('One\nTwo');
  });

  test('UIC-FIELD-1.11 UIC-TEXT-FIELD-2.1 reaches the restore button by Tab and commits on leaving', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const commit = field(page, 'commit');
    const city = commit.getByRole('textbox', { name: 'City' });
    await city.focus();
    await city.pressSequentially('s');
    await page.keyboard.press('Tab');
    await expect(commit.getByRole('button', { name: 'Restore City' })).toBeFocused();
    await expect(commit).toHaveAttribute('data-dirty', 'true');
    await expect(commit).toHaveAttribute('data-focused', 'true');
    await expect(commit).not.toHaveAttribute('data-touched');
    await expect(output(page, 'Committed')).toHaveText('Oslo');
    await page.keyboard.press('Tab');
    await expect(field(page, 'note').getByRole('textbox', { name: 'Note' })).toBeFocused();
    await expect(output(page, 'Committed')).toHaveText('Oslos');
    await expect(commit).not.toHaveAttribute('data-dirty');
    await expect(commit).toHaveAttribute('data-touched', 'true');
  });

  test('UIC-TEXT-FIELD-2.4 restores, undoes and clears from the field menu', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const dirty = field(page, 'dirty');
    const input = dirty.getByRole('textbox', { name: 'Favourite fruit' });
    await input.fill('Plum');
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await dirty.getByRole('button', { name: 'Restore Favourite fruit' }).click();
    await expect(input).toHaveValue('Apple');
    await expect(input).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(input).toHaveValue('Plum');
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(input).toHaveValue('Apple');

    await dirty.getByRole('button', { name: 'Favourite fruit actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(input).toHaveValue('');
    // The input's own text keeps the browser's menu; the rest of the field opens the field menu.
    await dirty.locator('.ui-field__label').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(input).toHaveValue('Pear');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved')).toHaveText('Pear');
    await expect(dirty).not.toHaveAttribute('data-dirty');
  });

  test('UIC-TEXT-FIELD-1.3 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('text-field', { theme: 'dark' });
    await expect(cell(page, 'single', 'invalid').locator('.ui-text-field__input')).toHaveCSS(
      'border-top-color',
      'rgb(255, 123, 114)',
    );
    await lab.expectAccessible();
  });

  test('UIC-TEXT-FIELD-3.1 frames adornments with the input as one box', async ({ page, lab }) => {
    await lab.open('text-field');
    const website = field(page, 'website');
    const group = await website.locator('.ui-text-field__group').boundingBox();
    const start = await website.locator('.ui-text-field__start').boundingBox();
    const input = await website.getByRole('textbox', { name: 'Website' }).boundingBox();
    const end = await website.locator('.ui-text-field__end').boundingBox();
    expect(group?.height).toBe(28);
    expect((start?.x ?? 0) + (start?.width ?? 0)).toBeLessThanOrEqual(input?.x ?? 0);
    expect(end?.x ?? 0).toBeGreaterThanOrEqual((input?.x ?? 0) + (input?.width ?? 0));
    await expect(website.locator('.ui-text-field__input')).toHaveCSS('border-top-width', '0px');
    await website.getByRole('button', { name: 'Copy address' }).click();
    await expect(output(page, 'Copied')).toHaveText('yes');
    await lab.expectAccessible();
  });

  test('UIC-TEXT-FIELD-3.2 reveals a password from a toggle button that keeps the caret', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const password = field(page, 'password');
    const input = password.locator('input');
    const reveal = password.getByRole('button', { name: 'Show Password' });
    await expect(input).toHaveAttribute('type', 'password');
    await input.click();
    await reveal.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(reveal).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(reveal).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(reveal).toHaveAttribute('aria-pressed', 'false');
  });

  test('UIC-TEXT-FIELD-3.3 grows the notes from two to five rows, then scrolls', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const grow = field(page, 'grow');
    const area = grow.getByRole('textbox', { name: 'Notes' });
    await expect(grow).toHaveAttribute('data-autosize', 'true');
    const height = async () => (await area.boundingBox())?.height ?? 0;
    const empty = await height();
    await area.fill('One');
    expect(await height()).toBe(empty);
    await area.fill('One\nTwo\nThree\nFour');
    const four = await height();
    expect(four).toBeGreaterThan(empty);
    await area.fill('One\nTwo\nThree\nFour\nFive\nSix\nSeven\nEight');
    const full = await height();
    expect(full).toBeGreaterThan(four);
    expect(await area.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await area.fill('One');
    expect(await height()).toBe(empty);
  });

  test('UIC-TEXT-FIELD-3.4 counts the text in the description as it is typed', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const count = field(page, 'count');
    const input = count.getByRole('textbox', { name: 'Status' });
    await expect(count.locator('.ui-text-field__count')).toHaveText('0/20');
    await input.fill('Away');
    await expect(count.locator('.ui-text-field__count')).toHaveText('4/20');
    await expect(input).toHaveAccessibleDescription('Shown on your profile. 4/20');
    await expect(field(page, 'graphemes').locator('.ui-text-field__count')).toHaveText('1/3');
    await expect(field(page, 'graphemes')).toHaveAttribute('data-validation', 'valid');
  });

  test('UIC-TEXT-FIELD-4.1 filters typed and pasted text and keeps the caret', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const input = field(page, 'hex').getByRole('textbox', { name: 'Colour code' });
    await input.pressSequentially('a1-zb');
    await expect(input).toHaveValue('A1B');
    await expect(output(page, 'Code')).toHaveText('A1B');
    await input.press('ArrowLeft');
    await input.press('ArrowLeft');
    await input.pressSequentially('x');
    await expect(input).toHaveValue('A1B');
    expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(1);
    // Inserted text arrives as one edit, as a paste does.
    await page.keyboard.insertText('e-0');
    await expect(input).toHaveValue('AE01B');
    expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);

    const identifier = field(page, 'identifier').getByRole('textbox', { name: 'Identifier' });
    await identifier.press('End');
    await identifier.pressSequentially(' Big Bowl');
    await expect(identifier).toHaveValue('fruit_bowl_big_bowl');
    await lab.expectAccessible();
  });

  test('UIC-TEXT-FIELD-4.2 shows the display value at rest and the value while editing', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const sum = field(page, 'sum');
    const input = sum.getByRole('textbox', { name: 'Total apples' });
    await expect(input).toHaveValue('42');
    await expect(sum).toHaveAttribute('data-display-value', 'true');
    await input.focus();
    await expect(input).toHaveValue('12 + 30');
    await expect(sum).not.toHaveAttribute('data-display-value');
    await input.press('End');
    await input.pressSequentially(' + 8');
    await input.press('Tab');
    await expect(input).toHaveValue('50');
    await expect(output(page, 'Value')).toHaveText('12 + 30 + 8');
  });

  test('UIC-TEXT-FIELD-5.1 UIC-TEXT-FIELD-5.2 UIC-TEXT-FIELD-5.3 completes cities under the field', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const input = field(page, 'completions').getByRole('textbox', { name: 'Destinations' });
    await input.click();
    await input.pressSequentially('Lisbon, L');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(4);
    await expect(input).toBeFocused();
    const box = await field(page, 'completions').locator('.ui-text-field__box').boundingBox();
    const popover = await page.locator('.ui-text-field__completions').boundingBox();
    expect(popover && box && popover.y >= box.y + box.height).toBe(true);
    expect(popover && box && Math.abs(popover.x - box.x) < 2).toBe(true);
    expect(popover && box && popover.width >= box.width - 1).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      (await list.getByRole('option').nth(1).getAttribute('id')) ?? '',
    );
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(input).toHaveValue('Lisbon, London');
    await expect(output(page, 'completions')).toHaveText('');
    await page.keyboard.press('Control+z');
    await expect(input).toHaveValue('Lisbon, L');
    await page.keyboard.press('Control+Space');
    await expect(list.getByRole('option')).toHaveCount(4);
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(output(page, 'completions')).toHaveText('Lisbon, L');
    const drawn = field(page, 'drawn-completions').getByRole('textbox');
    await drawn.click();
    await drawn.pressSequentially('Os');
    await expect(list.getByRole('option')).toHaveText(['Oslo Norway']);
    await lab.expectAccessible();
  });
});
