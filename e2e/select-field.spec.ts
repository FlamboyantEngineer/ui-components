import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, layout: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} layout=${layout}"]`);
}

function modeCell(page: Page, state: string, mode: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} mode=${mode}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
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
    const cells = page.locator('table[data-lab-matrix="state layout"] td[data-lab-cell]');
    expect(await cells.count()).toBe(8 * 4);
    const resting = cell(page, 'resting', 'label-control');
    await expect(resting.getByRole('button', { name: 'Apple Fruit' })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
    await expect(resting.locator('.ui-select-field__trigger')).toHaveCSS('height', '28px');
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
    await field(page, 'multiple').getByRole('button', { name: 'Select an option Basket' }).click();
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
    expect(popoverBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height);
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
    await basket.getByRole('button', { name: 'Select an option Basket' }).click();
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
});
