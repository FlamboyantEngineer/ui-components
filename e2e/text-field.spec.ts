import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell, controlHeight } from './fixtures.js';

function cell(page: Page, lines: string, state: string, layout = 'label-control'): Locator {
  return matrixCell(page, `lines=${lines} state=${state} layout=${layout}`);
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
    expect((await input.boundingBox())?.height).toBe(await controlHeight(page, 'md'));
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

    await dirty
      .locator('.ui-field__label', { hasText: 'Favourite fruit' })
      .click({ button: 'right' });
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
    expect(group?.height).toBe(await controlHeight(page, 'md'));
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

  for (const hasCanParse of [true, false]) {
    test(`UIC-TEXT-FIELD-2.3 checks initial and edited URLs with URL.canParse ${hasCanParse ? 'available' : 'unavailable'}`, async ({
      page,
      lab,
    }) => {
      if (!hasCanParse) {
        await page.addInitScript(() => {
          Object.defineProperty(URL, 'canParse', { configurable: true, value: undefined });
        });
      }
      await lab.open('text-field');
      const homepage = field(page, 'url-check');
      const input = homepage.getByRole('textbox', { name: 'Homepage' });
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(homepage).toContainText('Enter a full URL, such as https://example.com.');
      expect(await input.evaluate((node: HTMLInputElement) => node.validity.typeMismatch)).toBe(
        true,
      );
      await input.fill('https://example.com');
      await input.press('Enter');
      await expect(input).not.toHaveAttribute('aria-invalid');
      expect(await input.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(true);
      await expect(homepage).not.toContainText('Enter a full URL, such as https://example.com.');

      const website = field(page, 'empty-url-check');
      const empty = website.getByRole('textbox', { name: 'Website' });
      await expect(empty).toHaveValue('');
      await expect(empty).not.toHaveAttribute('aria-invalid');
      await empty.pressSequentially('h');
      await expect(empty).toHaveAttribute('aria-invalid', 'true');
      await expect(website).toContainText('Enter a full URL, such as https://example.com.');
      expect(await empty.evaluate((node: HTMLInputElement) => node.validity.typeMismatch)).toBe(
        true,
      );
      await empty.fill('https://example.com');
      await expect(empty).not.toHaveAttribute('aria-invalid');
      await expect(website).not.toContainText('Enter a full URL, such as https://example.com.');
      expect(await empty.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(true);
      await empty.clear();
      await expect(empty).not.toHaveAttribute('aria-invalid');
      await expect(website).not.toContainText('Enter a full URL, such as https://example.com.');
      expect(await empty.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(true);
    });
  }

  test('UIC-TEXT-FIELD-3.3 grows an adorned text area inside its frame', async ({ page, lab }) => {
    await lab.open('text-field');
    const log = field(page, 'adorned-log');
    const area = log.getByRole('textbox', { name: 'Log' });
    const inside = async () => {
      const frame = await log.locator('.ui-text-field__group').boundingBox();
      const box = await area.boundingBox();
      const label = await log.locator('.ui-field__label').boundingBox();
      expect(box && frame).toBeTruthy();
      if (!box || !frame || !label) return;
      expect(box.y).toBeGreaterThanOrEqual(frame.y);
      expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
      expect(frame.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
      return frame.height;
    };
    const five = await inside();
    await area.fill('One');
    const one = await inside();
    expect(one).toBe(await controlHeight(page, 'md'));
    expect(five).toBeGreaterThan(one ?? 0);
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
  test('UIC-COMPLETION-LIST-2.4 completes an email field, which has no caret, as one undoable edit', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const input = field(page, 'email-completions').getByRole('textbox', { name: 'Email' });
    await input.click();
    await input.pressSequentially('ali');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveText(['alice@example.com']);
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(input).toHaveValue('alice@example.com');
    await page.keyboard.press('Control+z');
    await expect(input).toHaveValue('ali');
    await input.fill('a');
    await page.keyboard.press('Control+Space');
    await list.getByRole('option', { name: 'ada@example.com' }).click();
    await expect(input).toHaveValue('ada@example.com');
    await expect(input).toBeFocused();
  });

  test('UIC-TEXT-FIELD-1.2 UIC-TEXT-FIELD-3.3 keeps long values inside bounded boxes with the caret reaching the end', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const line = field(page, 'long-line').getByRole('textbox');
    const length = (await line.inputValue()).length;
    expect(await line.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await line.click();
    await page.keyboard.press('End');
    await expect.poll(() => line.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    expect(await line.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(length);
    await page.keyboard.press('Home');
    await expect.poll(() => line.evaluate((node) => node.scrollLeft)).toBe(0);

    for (const [name, maximum] of [
      ['long-notes', 120],
      ['long-grow', 220],
    ] as const) {
      const area = field(page, name).getByRole('textbox');
      const box = await area.boundingBox();
      expect(box?.height).toBeLessThanOrEqual(maximum);
      // Wrapped, never sideways.
      expect(await area.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      expect(await area.evaluate((node) => node.scrollHeight > node.clientHeight * 3)).toBe(true);
      await area.click();
      await page.keyboard.press('Control+End');
      const text = await area.inputValue();
      expect(await area.evaluate((node: HTMLTextAreaElement) => node.selectionStart)).toBe(
        text.length,
      );
      // The last line is in view: at most the text area's bottom padding stays below it.
      await expect
        .poll(() => area.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop))
        .toBeLessThanOrEqual(10);
      await page.keyboard.type(' End.');
      await expect(area).toHaveValue(`${text} End.`);
    }
    const grow = await field(page, 'long-grow').getByRole('textbox').boundingBox();
    const fixed = await field(page, 'long-notes').getByRole('textbox').boundingBox();
    expect(grow?.height ?? 0).toBeGreaterThan(fixed?.height ?? 0);
    expect(
      await field(page, 'long-notes')
        .getByRole('textbox')
        .evaluate((node) => getComputedStyle(node).resize),
    ).toBe('vertical');
  });
});

test.describe('Text Field driven by an editor', () => {
  test('UIC-TEXT-FIELD-6.1 UIC-TEXT-FIELD-6.2 runs a caller-owned suggestion list on the input', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const demo = page.locator('[data-lab-demo="editor"]');
    const input = demo.getByRole('combobox', { name: 'Town' });
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await page.keyboard.type('Ber');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const list = demo.getByRole('listbox', { name: 'Town suggestions' });
    await expect(list.getByRole('option')).toHaveText(['Bergen', 'Bern', 'Berlin']);
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'lab-town-1');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Bern');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Home');
    await expect(demo.locator('[data-lab-output="Caret"]')).toHaveText('0');
    await demo.getByRole('button', { name: 'Select the town' }).click();
    await expect(input).toBeFocused();
    await page.keyboard.type('Bologna');
    await expect(input).toHaveValue('Bologna');
    await lab.expectAccessible('[data-lab-demo="editor"]');
  });
});

test.describe('Text Field with a dialog of suggestions', () => {
  test('UIC-TEXT-FIELD-6.2 declares the dialog popup and the busy load on the input', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    const demo = page.locator('[data-lab-demo="dialog-suggestions"]');
    const input = demo.getByRole('combobox', { name: 'Person' });
    await expect(input).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(input).toHaveAttribute('aria-busy', 'false');
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await page.keyboard.type('Gr');
    await expect(input).toHaveAttribute('aria-busy', 'true');
    await expect(input).toHaveAttribute('aria-busy', 'false');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByRole('dialog', { name: 'People' })).toContainText('Grace Hopper');
    await lab.expectAccessible('[data-lab-demo="dialog-suggestions"]');
  });
});

test('UIC-FIELD-7.2 checks a multiline text as a whole with a multiline pattern', async ({
  page,
  lab,
}) => {
  await lab.open('text-field');
  const field = page.getByRole('textbox', { name: 'Line codes' });
  await field.focus();
  await field.blur();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await field.fill('OK\n7\n42');
  await field.blur();
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
});
