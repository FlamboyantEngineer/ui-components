import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

function cell(page: Page, variant: string, state: string, size: string): Locator {
  return page.locator(`[data-lab-cell="variant=${variant} state=${state} size=${size}"]`);
}

test.describe('Combobox lab', () => {
  test('UIC-COMBOBOX-1.1 UIC-COMBOBOX-1.2 draws fields at four sizes with the search variant', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const cells = page.locator('table[data-lab-matrix="variant state size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 6 * 4);
    for (const [size, height] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const field = cell(page, 'default', 'resting', size).locator('.ui-combobox__field');
      expect((await field.boundingBox())?.height).toBe(height);
    }
    await expect(
      cell(page, 'search', 'resting', 'md').locator('.ui-combobox__search-icon'),
    ).toBeVisible();
    await expect(
      cell(page, 'default', 'resting', 'md').locator('.ui-combobox__search-icon'),
    ).toHaveCount(0);
    await expect(cell(page, 'default', 'resting', 'md').getByRole('combobox')).toHaveAccessibleName(
      'default resting md',
    );
    await lab.expectAccessible();
  });

  test('UIC-COMBOBOX-1.3 shows disabled, read-only, invalid and pending states', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    await expect(cell(page, 'default', 'disabled', 'md').getByRole('combobox')).toBeDisabled();
    await expect(
      cell(page, 'default', 'disabled', 'md').locator('.ui-combobox__clear'),
    ).toHaveCount(0);
    const readOnly = cell(page, 'default', 'read-only', 'md');
    await expect(readOnly.getByRole('combobox')).toHaveAttribute('readonly', '');
    await expect(readOnly.locator('.ui-combobox__field')).toHaveCSS('border-top-style', 'dashed');
    await expect(cell(page, 'default', 'invalid', 'md').locator('.ui-combobox__error')).toHaveText(
      'Not in season',
    );
    const pending = cell(page, 'search', 'pending', 'md');
    await expect(pending.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
    await expect(pending.locator('.ui-combobox__spinner')).toBeVisible();
  });

  test('UIC-COMBOBOX-1.4 clears the text and keeps focus in the input', async ({ page, lab }) => {
    await lab.open('combobox');
    const field = cell(page, 'default', 'with value', 'md');
    const input = field.getByRole('combobox');
    await expect(input).toHaveValue('Apple');
    await field.getByRole('button', { name: 'Clear' }).click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(field.locator('.ui-combobox__clear')).toHaveCount(0);
  });

  test('UIC-COMBOBOX-2.1 UIC-COMBOBOX-2.3 UIC-COMBOBOX-2.4 UIC-COMBOBOX-2.7 filters, highlights and picks by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const area = section(page, 'Picking');
    const input = area.getByRole('combobox', { name: 'Fruit' });
    await input.click();
    await page.keyboard.type('e');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option')).toHaveCount(5);
    await expect(listbox.getByRole('group', { name: 'Citrus' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: /^Lime/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    const popover = page.locator('.ui-combobox__popover');
    await expect(popover).toHaveAttribute('data-layer', 'dropdown');
    await expect(popover).toHaveCSS('z-index', '130');
    const fieldBox = await area.locator('.ui-combobox__field').boundingBox();
    const popoverBox = await popover.boundingBox();
    expect(
      Math.abs((popoverBox?.y ?? 0) - ((fieldBox?.y ?? 0) + (fieldBox?.height ?? 0) + 4)),
    ).toBeLessThan(1);
    expect(popoverBox?.width ?? 0).toBeGreaterThanOrEqual((fieldBox?.width ?? 0) - 1);
    await lab.expectAccessible('.ui-combobox__popover');

    await page.keyboard.press('ArrowDown');
    const apple = listbox.getByRole('option', { name: /^Apple/ });
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      (await apple.getAttribute('id')) ?? '',
    );
    await expect(apple).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Lemon');
    await expect(input).toBeFocused();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(area.locator('[data-lab-output="chosen"]')).toHaveText('lemon');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(input).toHaveValue('Lemon');
  });

  test('UIC-COMBOBOX-2.6 shows the empty state when nothing matches', async ({ page, lab }) => {
    await lab.open('combobox');
    await section(page, 'Picking').getByRole('combobox', { name: 'Fruit' }).click();
    await page.keyboard.type('zzz');
    await expect(page.locator('.ui-combobox__empty')).toHaveText('No results');
  });

  test('UIC-COMBOBOX-2.2 shows suggestions the caller fetches, marking the field busy', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const area = section(page, 'Asynchronous suggestions');
    const input = area.getByRole('combobox', { name: 'City' });
    const deliver = area.locator('[data-lab-action="deliver"]');
    const request = area.locator('[data-lab-output="request"]');
    await input.click();
    await page.keyboard.type('li');
    await expect(request).toHaveText('li');
    await expect(input).toHaveAttribute('aria-busy', 'true');
    await expect(area.locator('.ui-combobox__spinner')).toBeVisible();

    await deliver.click();
    await expect(request).toHaveText('nothing');
    await expect(input).not.toHaveAttribute('aria-busy');
    await expect(area.locator('.ui-combobox__spinner')).toHaveCount(0);
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['Lima', 'Lisbon']);

    await page.keyboard.type('mo');
    await expect(request).toHaveText('limo');
    await deliver.click();
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ui-combobox__empty')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('limo');
  });

  test('UIC-COMBOBOX-2.3 opens on focus after Tab scrolls the field into view', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const input = section(page, 'Open on focus').getByRole('combobox', { name: 'Fruit on focus' });
    const previous = section(page, 'Custom options').getByRole('combobox', { name: 'Capital' });
    await previous.evaluate((element) => element.focus({ preventScroll: true }));
    await expect(input).not.toBeInViewport();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowDown');
    const first = list.getByRole('option', { name: /^Apple/ });
    await expect(first).toHaveAttribute('data-focused', 'true');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      requireDefined(await first.getAttribute('id')),
    );
    await expect(async () => expect(await page.evaluate(() => scrollY)).toBe(scroll)).toPass();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
  });

  test('UIC-COMBOBOX-1.3 stays accessible in the dark theme', async ({ page, lab }) => {
    await lab.open('combobox', { theme: 'dark' });
    await lab.expectAccessible();
    await section(page, 'Picking').getByRole('combobox', { name: 'Fruit' }).click();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await lab.expectAccessible('.ui-combobox__popover');
  });

  test('UIC-COMBOBOX-2.9 UIC-COMBOBOX-3.1 picks several cities from a generator as removable chips', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const area = section(page, 'Multiple selection');
    const output = area.locator('[data-lab-output="cities"]');
    const chips = area.getByRole('grid', { name: 'Cities selected values' });
    await expect(chips.getByRole('row')).toHaveText(['Lima', 'Oslo']);
    const input = area.getByRole('combobox', { name: 'Cities' });
    await input.focus();
    await page.keyboard.type('par');
    await page.getByRole('option', { name: 'Paris' }).click();
    await expect(output).toHaveText('lima, oslo, paris');
    await expect(input).toHaveValue('');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(chips.getByRole('row')).toHaveText(['Lima', 'Oslo', 'Paris']);
    const field = await area.locator('.ui-combobox__field').boundingBox();
    const group = await area.locator('.ui-combobox__chips').boundingBox();
    if (!field || !group) throw new Error('not rendered');
    expect(group.y).toBeGreaterThanOrEqual(field.y);
    expect(group.y + group.height).toBeLessThanOrEqual(field.y + field.height);
    await lab.expectAccessible();
    await chips.getByRole('row', { name: 'Lima' }).getByRole('button').click();
    await expect(output).toHaveText('oslo, paris');
    await chips.getByRole('row', { name: 'Oslo' }).focus();
    await page.keyboard.press('Backspace');
    await expect(output).toHaveText('paris');
  });

  test('UIC-COMBOBOX-3.2 adds a city that is not listed', async ({ page, lab }) => {
    await lab.open('combobox');
    const area = section(page, 'Adding an option');
    const input = area.getByRole('combobox', { name: 'Destination' });
    await input.focus();
    await page.keyboard.type('Kyoto');
    const create = page.getByRole('option', { name: 'Add “Kyoto”' });
    await expect(create).toHaveClass(/ui-combobox__create/);
    await lab.expectAccessible('.ui-combobox__popover');
    // The row ends the list: Arrow Up from no highlight reaches it.
    await page.keyboard.press('ArrowUp');
    await expect(create).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('Enter');
    await expect(area.locator('[data-lab-output="destination"]')).toHaveText('kyoto');
    await expect(input).toHaveValue('Kyoto');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.keyboard.press('Control+A');
    await page.keyboard.type('ky');
    await expect(page.getByRole('option')).toHaveText([
      'Paris',
      'Lima',
      'Oslo',
      'Cairo',
      'Quito',
      'Kyoto',
      'Add “ky”',
    ]);
  });

  test('UIC-COMBOBOX-3.3 UIC-COMBOBOX-3.4 UIC-COMBOBOX-4.3 highlights, completes and marks typed text', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const aid = (name: string) =>
      page.locator(`[data-lab-cell="aid=${name}"]`).getByRole('combobox');

    // Retried from an empty input: on a loaded runner the first keys can land before the list opens.
    await expect(async () => {
      const highlight = aid('highlight matches');
      await highlight.fill('');
      await highlight.focus();
      await page.keyboard.type('an');
      await expect(page.locator('.ui-combobox__option-label mark.ui-text-match')).toHaveText(
        ['anan', 'an'],
        { timeout: 3000 },
      );
    }).toPass({ timeout: 20000 });
    await lab.expectAccessible('.ui-combobox__popover');
    await page.keyboard.press('Escape');

    const autoHighlight = aid('auto highlight');
    // Retried from an empty input for the same reason as above.
    await expect(async () => {
      await autoHighlight.fill('');
      await autoHighlight.focus();
      await page.keyboard.type('an');
      await expect(page.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'data-focused',
        'true',
        { timeout: 3000 },
      );
    }).toPass({ timeout: 20000 });
    await page.keyboard.press('Enter');
    await expect(autoHighlight).toHaveValue('Banana');

    const inline = aid('inline completion');
    await inline.focus();
    await page.keyboard.type('ch');
    await expect(inline).toHaveValue('cherry');
    expect(
      await inline.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]),
    ).toEqual([2, 6]);
    await expect(inline).toHaveAttribute('aria-autocomplete', 'both');
    await page.keyboard.press('Enter');
    await expect(inline).toHaveValue('Cherry');
  });

  test('UIC-COMBOBOX-4.1 renders a long list virtualized', async ({ page, lab }) => {
    await lab.open('combobox');
    const input = section(page, 'Virtualized list').getByRole('combobox', { name: 'Any city' });
    await input.scrollIntoViewIfNeeded();
    await input.focus();
    await page.keyboard.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option', { name: 'Paris 1', exact: true })).toHaveAttribute(
      'aria-setsize',
      '5000',
    );
    for (let step = 0; step < 24; step += 1) await page.keyboard.press('ArrowDown');
    // The highlight scrolls the list, which renders only the options near the view.
    const reached = listbox.getByRole('option', { name: 'Paris 25', exact: true });
    await expect(reached).toHaveAttribute('data-focused', 'true');
    await expect(reached).toBeInViewport();
    expect(await listbox.getByRole('option').count()).toBeLessThan(100);
    await expect(listbox.getByRole('option', { name: 'Paris 1', exact: true })).toHaveCount(0);
    await page.keyboard.type('5000');
    await expect(listbox.getByRole('option')).toHaveText(['Perth 5000']);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Perth 5000');
  });

  test('UIC-COMBOBOX-4.2 loads more cities as the end of the list comes into view', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('combobox');
    const area = section(page, 'Loading more');
    const input = area.getByRole('combobox', { name: 'Paged city' });
    await input.focus();
    const listbox = page.getByRole('listbox');
    // The first key can land before the field is ready to open its list, so press until it opens.
    await expect(async () => {
      if (!(await listbox.isVisible())) await input.press('ArrowDown');
      await expect(page.getByRole('option', { name: 'Paris 1', exact: true })).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    // Pause only once the list is open: the popover needs running timers to appear.
    await page.clock.pauseAt(Date.now() + 1000);
    await page.locator('.ui-combobox__listbox').evaluate((listbox) => {
      listbox.scrollTop = listbox.scrollHeight;
    });
    await expect(page.locator('.ui-combobox__load-more')).toHaveText('Loading');
    await page.clock.runFor(500);
    await expect(area.locator('[data-lab-output="loaded"]')).toHaveText('40');
    await expect(page.getByRole('option', { name: 'Hanoi 30', exact: true })).toBeAttached();
    await page.clock.resume();
  });

  test('UIC-COMBOBOX-4.4 draws custom option content', async ({ page, lab }) => {
    await lab.open('combobox');
    const input = section(page, 'Custom options').getByRole('combobox', { name: 'Capital' });
    await input.scrollIntoViewIfNeeded();
    await input.focus();
    await page.keyboard.press('ArrowDown');
    const paris = page.getByRole('option', { name: /^Paris · France/ });
    await expect(paris).toHaveClass(/ui-combobox__option/);
    await expect(paris.locator('[data-lab-option] strong')).toHaveText('Paris');
    await expect(paris).toContainText('←');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Paris');
  });

  test('UIC-COMBOBOX-5.1 UIC-COMBOBOX-5.2 UIC-COMBOBOX-5.5 searches remotely with filters in the list header', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const area = section(page, 'Remote search');
    const input = area.getByRole('combobox', { name: 'Search city' });
    await input.click();
    await page.keyboard.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('group', { name: 'Recently used' })).toBeVisible();
    await expect(listbox.getByRole('option')).toHaveText(['Paris', 'Lima']);
    await page.keyboard.type('li');
    await expect(listbox.getByRole('option')).toHaveText(['Lima', 'Lisbon']);
    await expect(input).not.toHaveAttribute('aria-busy');
    const header = page.locator('.ui-combobox__list-header');
    await header.getByRole('button', { name: 'Americas' }).click();
    await expect(input).toBeFocused();
    await expect(listbox.getByRole('option')).toHaveText(['Lima']);
    await expect(page.locator('.ui-combobox__popover')).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('.ui-combobox__popover');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Lima');
    await expect(area.locator('[data-lab-output="remote"]')).toHaveText('lima');
    await lab.expectAccessible();
  });

  test('UIC-COMBOBOX-5.1 UIC-COMBOBOX-5.2 UIC-COMBOBOX-5.4 says why a remote list is empty', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const input = section(page, 'Remote search').getByRole('combobox', { name: 'Search city' });
    await input.click();
    await page.keyboard.type('o');
    const listbox = page.getByRole('listbox');
    // Too short to search: the recently used cities stay listed.
    await expect(listbox.getByRole('option')).toHaveText(['Paris', 'Lima']);
    const empty = page.locator('.ui-combobox__empty');
    await page.keyboard.type('ffline');
    await expect(empty).toHaveText('Search is unavailable.');
    await input.fill('zz');
    await expect(empty).toHaveText('No city matches; try another region.');
  });

  test('UIC-COMBOBOX-3.5 draws each chip with its option icon', async ({ page, lab }) => {
    await lab.open('combobox');
    const chips = section(page, 'Chips with icons').getByRole('grid', {
      name: 'Types selected values',
    });
    await expect(chips.getByRole('row')).toHaveText(['Notes', 'Events']);
    const icon = chips.getByRole('row', { name: 'Events' }).locator('.ui-combobox__chip-icon');
    await expect(icon).toBeVisible();
    await expect(icon.locator('[data-glyph="calendar"]')).toHaveCount(1);
    expect((await icon.boundingBox())?.width).toBe(14);
  });
  test('UIC-COMBOBOX-3.1 UIC-COMBOBOX-3.5 remembers the latest chip icon after filtering', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const demo = page.locator('[data-lab-demo="remembered-chips"]');
    const chips = demo.getByRole('grid', { name: 'Saved types selected values' });
    const icon = chips.locator('.ui-combobox__chip-icon');
    await expect(icon).toHaveAttribute('data-glyph', 'file');
    await demo.getByRole('button', { name: 'Change icon' }).click();
    await expect(icon).toHaveAttribute('data-glyph', 'folder');
    await demo.getByRole('button', { name: 'Hide suggestions' }).click();
    await expect(chips.getByRole('row', { name: 'Notes' })).toBeVisible();
    await expect(icon).toHaveAttribute('data-glyph', 'folder');
    await lab.expectAccessible('[data-lab-demo="remembered-chips"]');
  });

  test('UIC-COMBOBOX-1.1 UIC-COMBOBOX-2.1 draws and reads label and descriptions of zero', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const demo = page.locator('[data-lab-demo="zero"]');
    const input = demo.getByRole('combobox', { name: '0', exact: true });
    await expect(input).toHaveAccessibleDescription('0');
    await input.click();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Pears 0' })).toBeVisible();
  });

  test('UIC-COMBOBOX-5.5 keeps focus in a text filter in the list header', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const input = section(page, 'Filter in the list header').getByRole('combobox', {
      name: 'City by first letters',
    });
    await input.click();
    await page.keyboard.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(12);
    const filter = page.getByRole('textbox', { name: 'Starts with' });
    await filter.click();
    await page.keyboard.type('pa');
    await expect(filter).toBeFocused();
    await expect(filter).toHaveValue('pa');
    await expect(input).toHaveValue('');
    await expect(listbox.getByRole('option')).toHaveText(['Paris']);
    // The text field keeps its own keys: Enter commits the filter, and Escape would revert an edit.
    await page.keyboard.press('Enter');
    await expect(filter).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(listbox).toHaveCount(0);
    await expect(input).toBeFocused();
  });
});

for (const [device, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['phone', { width: 390, height: 664 }],
] as const) {
  for (const theme of ['light', 'dark']) {
    test(`UIC-COMBOBOX-1.5 keeps the field inside a narrow row on a ${device} screen in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize(viewport);
      await lab.open('combobox', { theme });
      for (const name of ['flex, empty', 'flex, chosen', 'grid, empty', 'grid, chosen']) {
        const row = page.locator(`[data-lab-row="${name}"]`);
        await row.scrollIntoViewIfNeeded();
        const combobox = row.locator('.ui-combobox');
        const rootBox = await combobox.boundingBox();
        const fieldBox = await combobox.locator('.ui-combobox__field').boundingBox();
        const noteBox = await row.getByRole('textbox', { name: `Note (${name})` }).boundingBox();
        if (!rootBox || !fieldBox || !noteBox) throw new Error(`${name} is not laid out`);
        expect(fieldBox.x + fieldBox.width).toBeLessThanOrEqual(rootBox.x + rootBox.width + 0.5);
        expect(fieldBox.x + fieldBox.width).toBeLessThanOrEqual(noteBox.x);
        const toggle = combobox.locator('.ui-combobox__button');
        await expect(toggle).toBeVisible();
        const toggleBox = await toggle.boundingBox();
        expect((toggleBox?.x ?? 0) + (toggleBox?.width ?? 0)).toBeLessThanOrEqual(
          fieldBox.x + fieldBox.width + 0.5,
        );
        if (name.endsWith('chosen')) {
          await expect(combobox.getByRole('button', { name: 'Clear' })).toBeInViewport({
            ratio: 1,
          });
        }
        const input = combobox.getByRole('combobox');
        await input.click();
        await input.fill('Ch');
        await expect(page.getByRole('option', { name: 'Cherry' })).toBeVisible();
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
      }
    });
  }
}
