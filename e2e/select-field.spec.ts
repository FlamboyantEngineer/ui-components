import type { Locator, Page } from '@playwright/test';
import { cellSelector, controlHeight, expect, familySelector, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

function cell(page: Page, state: string, layout: string): Locator {
  return page.locator(
    `${familySelector('list')} ${cellSelector(`state=${state} layout=${layout}`)}`,
  );
}

function modeCell(page: Page, state: string, mode: string): Locator {
  return page.locator(`${familySelector('list')} ${cellSelector(`state=${state} mode=${mode}`)}`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`${familySelector('list')} [data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`${familySelector('list')} [data-lab-output="${name}"]`);
}

async function width(locator: Locator): Promise<number> {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect.width;
}

test.describe('Select Field lab', () => {
  test('UIC-SELECT-FIELD-1.1 UIC-SELECT-FIELD-1.3 UIC-SELECT-FIELD-2.1 UIC-SELECT-FIELD-2.3 draws every layout and state', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const cells = page.locator(
      `${familySelector('list')} table[data-lab-matrix="state layout"] td[data-lab-cell]`,
    );
    expect(await cells.count()).toBe(8 * 4);
    const resting = cell(page, 'resting', 'label-control');
    await expect(resting.getByRole('button', { name: 'Apple Fruit' })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
    await expect(resting.locator('.ui-select-field__trigger')).toHaveCSS(
      'height',
      `${await controlHeight(page, 'md')}px`,
    );
    await expect(
      cell(page, 'required', 'label-control').locator('.ui-select-field__value'),
    ).toHaveAttribute('data-placeholder', 'true');
    await expect(
      cell(page, 'disabled', 'label-control').locator('.ui-select-field__trigger'),
    ).toBeDisabled();
    await expect(
      cell(page, 'read-only', 'label-control').locator('.ui-select-field__trigger'),
    ).toHaveCSS('border-top-style', 'dashed');
    await expect(
      cell(page, 'invalid', 'label-control').locator('.ui-select-field__trigger'),
    ).toHaveCSS('border-top-color', 'rgb(207, 34, 46)');
    const dirty = cell(page, 'dirty', 'label-control');
    await expect(dirty.locator('.ui-select-field__previous del')).toHaveText('Pear');
    await expect(dirty.getByRole('button', { name: 'Restore Fruit' })).toBeVisible();
    await expect(
      modeCell(page, 'dirty', 'multiple').locator('.ui-select-field__removed del'),
    ).toHaveText('Pear');
    await lab.expectAccessible();
  });

  test('UIC-SELECT-FIELD-1.3 passes axe in the dark theme, with the list open', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field', { theme: 'dark' });
    await lab.expectAccessible();
    await field(page, 'multiple').getByRole('button', { name: '2 selected Basket' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await lab.expectAccessible('.ui-select-field__popover');
  });

  test('UIC-SELECT-FIELD-2.2 fits the trigger to its widest option, capped at the column', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    await expect(field(page, 'short').locator('.ui-select-field__select')).toHaveCSS(
      '--ui-select-field-label-width',
      /\d+px/,
    );
    const short = field(page, 'short').locator('.ui-select-field__trigger');
    const long = field(page, 'long').locator('.ui-select-field__trigger');
    const shortWidth = await width(short);
    expect(shortWidth).toBeLessThan(200);
    const control = await width(field(page, 'long').locator('.ui-field__control'));
    expect(await width(long)).toBeLessThanOrEqual(control);
    expect(await width(long)).toBeGreaterThan(shortWidth);
    await field(page, 'short').getByRole('button').first().click();
    await page.getByRole('option', { name: 'Pear' }).click();
    expect(await width(short)).toBe(shortWidth);
  });

  test('UIC-SELECT-FIELD-3.1 UIC-SELECT-FIELD-3.2 UIC-SELECT-FIELD-3.3 picks from the keyboard below the trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const trigger = field(page, 'single').getByRole('button', { name: /Fruit$/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    const popover = page.locator('.ui-select-field__popover');
    await expect(popover).toHaveAttribute('data-placement', 'bottom');
    const triggerBox = await trigger.boundingBox();
    const popoverBox = await popover.boundingBox();
    expect(requireDefined(popoverBox).y).toBeGreaterThanOrEqual(
      requireDefined(triggerBox).y + requireDefined(triggerBox).height,
    );
    await expect(page.getByRole('option', { name: 'Apple Crisp and sweet' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Fig' })).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(output(page, 'Committed')).toHaveText('fig');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName('Fig Fruit');
  });

  test('UIC-SELECT-FIELD-3.1 locks page scrolling while open and closes on an outside press', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    await field(page, 'single')
      .getByRole('button', { name: /Fruit$/ })
      .click();
    await expect(page.getByRole('listbox')).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);
    await expect(page.getByRole('listbox')).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await page.mouse.click(5, 5);
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('UIC-SELECT-FIELD-3.4 UIC-SELECT-FIELD-4.1 UIC-SELECT-FIELD-4.2 UIC-SELECT-FIELD-4.3 toggles, removes and restores chips', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const basket = field(page, 'multiple');
    const chips = basket.getByRole('grid', { name: 'Basket selected values' });
    await expect(chips.getByRole('row', { name: 'Fig' })).toHaveAttribute('data-change', 'added');
    await expect(basket.locator('.ui-select-field__removed del')).toHaveText('Apple');
    await chips.getByRole('button', { name: 'Remove Pear' }).click();
    await expect(output(page, 'Value')).toHaveText('fig');
    await basket.getByRole('button', { name: 'Restore Apple' }).click();
    await expect(output(page, 'Value')).toHaveText('apple, fig');
    await basket.getByRole('button', { name: '2 selected Basket' }).click();
    await page.getByRole('option', { name: 'Quince' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Pear' }).click();
    await expect(output(page, 'Value')).toHaveText('apple, pear, fig, quince');
    await page.keyboard.press('Escape');
    await chips.getByRole('row', { name: 'Quince' }).focus();
    await page.keyboard.press('Backspace');
    await expect(output(page, 'Value')).toHaveText('apple, pear, fig');
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('UIC-SELECT-FIELD-3.5 UIC-SELECT-FIELD-3.6 filters from a key typed on the closed trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const trigger = field(page, 'filter').getByRole('button', { name: /Orchard$/ });
    await trigger.focus();
    await page.keyboard.type('m');
    const search = page.getByRole('searchbox', { name: 'Search' });
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('m');
    await page.keyboard.type('an');
    await expect(page.locator('.ui-select-field__listbox').getByRole('option')).toHaveText([
      'Mango',
    ]);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAccessibleName('Mango Orchard');
    await trigger.click();
    await expect(page.getByRole('searchbox')).toHaveValue('');
  });

  test('UIC-SELECT-FIELD-1.4 clears and sets the default from the field menu', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const area = page.locator('[data-lab-section="Field menu"]');
    await area.getByRole('button', { name: 'Fruit actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(area.locator('.ui-select-field__value')).toHaveAttribute(
      'data-placeholder',
      'true',
    );
    await area.getByRole('button', { name: 'Fruit actions' }).click();
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(area.getByRole('button', { name: 'Pear Fruit' })).toBeVisible();
  });

  test('UIC-SELECT-FIELD-7.1 lists grouped options under headings and filters them', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const trigger = field(page, 'groups').locator('.ui-select-field__trigger');
    await trigger.click();
    const listbox = page.getByRole('listbox');
    const groups = listbox.getByRole('group');
    await expect(groups).toHaveCount(3);
    await expect(groups.nth(0)).toHaveAccessibleName('Fruit');
    await expect(groups.nth(1)).toHaveAccessibleName('Vegetables');
    await expect(groups.nth(1)).toHaveCSS('border-top-style', 'solid');
    await expect(listbox.getByRole('option', { name: 'Kale Leafy' })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(listbox.getByRole('option', { name: 'Pear' })).toBeFocused();
    await lab.expectAccessible('.ui-select-field__popover');
    await page.keyboard.press('Enter');
    await expect(output(page, 'Group committed')).toHaveText('pear');
    await field(page, 'groups-filter').locator('.ui-select-field__trigger').click();
    await page.keyboard.type('sal');
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['Salt']);
    await expect(page.getByRole('listbox').getByRole('group')).toHaveCount(1);
    await page.keyboard.press('Escape');
  });

  test('UIC-SELECT-FIELD-7.2 draws options through renderOption', async ({ page, lab }) => {
    await lab.open('select-field');
    const trigger = field(page, 'custom').locator('.ui-select-field__trigger');
    await expect(trigger).toHaveAccessibleName('Jon Berg Owner');
    await trigger.click();
    const option = page.getByRole('option', { name: /Lena Ortiz — Support/ });
    await expect(option.locator('[data-lab-option="lena"] strong')).toHaveText('LO');
    await expect(page.getByRole('option', { name: /Jon Berg/ })).toContainText('✓');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAccessibleName('Lena Ortiz Owner');
    await lab.expectAccessible();
  });

  test('UIC-SELECT-FIELD-7.3 virtualizes a long list and reaches its end from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const trigger = field(page, 'virtualized').locator('.ui-select-field__trigger');
    await trigger.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option', { name: 'Item 1', exact: true })).toBeVisible();
    expect(await listbox.getByRole('option').count()).toBeLessThan(60);
    await expect(listbox.getByRole('option', { name: 'Item 1', exact: true })).toBeFocused();
    await page.keyboard.press('End');
    const last = listbox.getByRole('option', { name: 'Item 5000' });
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    expect(await listbox.getByRole('option').count()).toBeLessThan(60);
    await lab.expectAccessible('.ui-select-field__popover');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAccessibleName('Item 5000 Number');
  });

  test('UIC-SELECT-FIELD-8.1 UIC-SELECT-FIELD-8.2 clears in one press and caps the values', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const clearable = field(page, 'clearable');
    await clearable.getByRole('button', { name: 'Clear Snack' }).click();
    const trigger = clearable.locator('.ui-select-field__trigger');
    await expect(trigger).toHaveAccessibleName('Select an option Snack');
    await expect(trigger).toBeFocused();
    await expect(clearable.getByRole('button', { name: 'Clear Snack' })).toHaveCount(0);
    await expect(page.getByRole('listbox')).toHaveCount(0);

    const limited = field(page, 'limited');
    await limited.locator('.ui-select-field__trigger').click();
    await page.getByRole('option', { name: 'Pear' }).click();
    await expect(output(page, 'Basket')).toHaveText('apple, pear');
    const fig = page.getByRole('option', { name: 'Fig' });
    await expect(fig).toHaveAttribute('aria-disabled', 'true');
    await fig.click({ force: true });
    await expect(output(page, 'Basket')).toHaveText('apple, pear');
    await page.keyboard.press('Escape');
    await limited.getByRole('button', { name: 'Clear Two fruits' }).click();
    await expect(output(page, 'Basket')).toHaveText('none');
    await lab.expectAccessible();
  });

  test('UIC-SELECT-FIELD-5.4 loads the next page of results at the end of the list', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    await field(page, 'paged').locator('.ui-select-field__trigger').click();
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(20);
    await expect(output(page, 'Pages')).toHaveText('1');
    await listbox.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(listbox.getByRole('option')).toHaveCount(40);
    await listbox.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(listbox.getByRole('option')).toHaveCount(60);
    await listbox.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(output(page, 'Pages')).toHaveText('3');
    await page.keyboard.type('1');
    await expect(listbox.getByRole('option')).toHaveCount(15);
  });

  test('UIC-SELECT-FIELD-5.4 offers no earlier page after a failed search', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    await field(page, 'paged').locator('.ui-select-field__trigger').click();
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(20);
    await page.keyboard.type('offline');
    await expect(listbox).toContainText('Search is unavailable.');
    await expect(output(page, 'Last request')).toHaveText('towns: "offline" from the start');
    await expect(
      listbox.getByRole('option').filter({ hasNotText: 'Search is unavailable.' }),
    ).toHaveCount(0);
    await expect(page.locator('.ui-select-field__load-more')).toHaveCount(0);
    await expect(output(page, 'Last request')).toHaveText('towns: "offline" from the start');
  });

  test('UIC-SELECT-FIELD-5.4 searches a new list from its first page', async ({ page, lab }) => {
    await lab.open('select-field');
    const trigger = field(page, 'paged').locator('.ui-select-field__trigger');
    await trigger.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(20);
    await listbox.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(output(page, 'Last request')).toHaveText('towns: "" from 20');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Search villages' }).click();
    await expect(output(page, 'Last request')).toHaveText('villages: "" from the start');
    await trigger.click();
    await expect(listbox.getByRole('option')).toHaveCount(20);
    await expect(listbox.getByRole('option').first()).toHaveText('Village 01');
    await listbox.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(output(page, 'Last request')).toHaveText('villages: "" from 20');
    await expect(listbox.getByRole('option')).toHaveCount(40);
  });
});

test.describe('Select Field trigger ref', () => {
  test('UIC-SELECT-FIELD-2.4 returns focus to the trigger through its ref', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const demo = page.locator('[data-lab-demo="trigger-ref"]');
    const back = demo.getByRole('button', { name: 'Back to the size' });
    await back.scrollIntoViewIfNeeded();
    await back.click();
    await expect(demo.getByRole('button', { name: /Size$/ })).toBeFocused();
  });

  test('UIC-SELECT-FIELD-1.3 closes an open select that locks and leaves it closed', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    await page.clock.install();
    await page.getByRole('button', { name: 'Lock in 1 s' }).click();
    const lockable = field(page, 'lockable');
    await lockable.getByRole('button', { name: /Lockable$/ }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.clock.runFor(1000);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(output(page, 'Open changes')).toHaveText('true, false');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(output(page, 'Open changes')).toHaveText('true, false');
  });

  test('UIC-SELECT-FIELD-8.2 keeps a missing committed value from passing the limit', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const limited = field(page, 'limited-missing');
    const restore = limited.getByRole('button', { name: 'Restore retired' });
    await expect(restore).toBeDisabled();
    await limited.getByRole('button', { name: 'Remove Apple' }).click();
    await expect(restore).toBeEnabled();
  });

  test('UIC-SELECT-FIELD-5.1 settles a remote search once the query stops changing', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const cities = field(page, 'search');
    const searches = output(page, 'Searches');
    await cities.getByRole('button').first().click();
    const search = page.getByRole('searchbox');
    await search.fill('li');
    await expect(page.getByRole('option', { name: 'Lisbon' })).toBeVisible();
    const settled = Number(await searches.textContent());
    expect(settled).toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(1500);
    await expect(searches).toHaveText(String(settled));
    await search.fill('oslo');
    await expect(page.getByRole('option', { name: 'Oslo' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Lisbon' })).toHaveCount(0);
    const next = Number(await searches.textContent());
    expect(next).toBeGreaterThan(settled);
    await page.waitForTimeout(1500);
    await expect(searches).toHaveText(String(next));
  });
});
