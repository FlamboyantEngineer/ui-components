import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell, controlHeight } from './fixtures.js';

function cell(page: Page, state: string, layout = 'label-control'): Locator {
  return matrixCell(page, `state=${state} layout=${layout}`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function tags(scope: Locator): Locator {
  return scope.getByRole('row');
}

/** Dispatches a paste of `text` at the element, as the browser does for a clipboard paste. */
async function paste(target: Locator, text: string): Promise<void> {
  await target.evaluate((node, value) => {
    const data = new DataTransfer();
    data.setData('text/plain', value);
    node.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  }, text);
}

test.describe('Tags Input lab', () => {
  test('UIC-TAGS-INPUT-1.1 UIC-TAGS-INPUT-1.3 frames the tags and the input as one box in each state', async ({
    page,
    lab,
  }) => {
    await lab.open('tags-input');
    const resting = cell(page, 'resting');
    const group = await resting.locator('.ui-tags-input__group').boundingBox();
    const apple = await resting.getByRole('row', { name: 'Apple' }).boundingBox();
    const input = await resting.getByRole('textbox', { name: 'Fruit' }).boundingBox();
    expect(group?.height).toBe(await controlHeight(page, 'md'));
    expect(apple?.x ?? 0).toBeGreaterThan(group?.x ?? 0);
    expect(input?.x ?? 0).toBeGreaterThan((apple?.x ?? 0) + (apple?.width ?? 0));
    expect(
      Math.abs(
        (input?.y ?? 0) + (input?.height ?? 0) / 2 - (apple?.y ?? 0) - (apple?.height ?? 0) / 2,
      ),
    ).toBeLessThanOrEqual(1);
    await expect(resting.getByRole('grid', { name: 'Fruit selected values' })).toBeVisible();

    const required = cell(page, 'required').getByRole('textbox', { name: 'Fruit' });
    await expect(required).toHaveAttribute('aria-invalid', 'true');
    await expect(required).toHaveAccessibleDescription('A value is required.');
    await required.fill('Plum');
    await required.press('Enter');
    await expect(required).not.toHaveAttribute('aria-invalid');
    await expect(tags(cell(page, 'required'))).toHaveText(['Plum']);
    await expect(cell(page, 'read-only').getByRole('textbox')).toHaveAttribute('readonly', '');
    await expect(cell(page, 'read-only').getByRole('button', { name: /^Remove/ })).toHaveCount(0);
    await expect(cell(page, 'disabled').getByRole('textbox')).toBeDisabled();
    await expect(
      cell(page, 'resting', 'control-only').getByRole('textbox', { name: 'Fruit' }),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-TAGS-INPUT-2.1 adds tags with Enter and each delimiter', async ({ page, lab }) => {
    await lab.open('tags-input');
    const entry = field(page, 'entry');
    const input = entry.getByRole('textbox', { name: 'Ingredients' });
    await input.click();
    await page.keyboard.type('Sugar');
    await page.keyboard.press('Enter');
    await page.keyboard.type(' Eggs , Milk;Bu');
    await expect(tags(entry)).toHaveText(['Flour', 'Sugar', 'Eggs', 'Milk']);
    await expect(input).toHaveValue('Bu');
    await expect(input).toBeFocused();
    await expect(output(page, 'Ingredients')).toHaveText('Flour | Sugar | Eggs | Milk');
  });

  test('UIC-TAGS-INPUT-2.2 splits a pasted list into tags', async ({ page, lab }) => {
    await lab.open('tags-input');
    const entry = field(page, 'entry');
    const input = entry.getByRole('textbox', { name: 'Ingredients' });
    await input.click();
    await paste(input, 'Salt, Pepper\nOil\r\nVinegar');
    await expect(tags(entry)).toHaveText(['Flour', 'Salt', 'Pepper', 'Oil', 'Vinegar']);
    await expect(input).toHaveValue('');
  });

  test('UIC-TAGS-INPUT-4.1 UIC-TAGS-INPUT-4.2 moves into the tags and removes the last with Backspace', async ({
    page,
    lab,
  }) => {
    await lab.open('tags-input');
    const labels = field(page, 'duplicates');
    const input = labels.getByRole('textbox', { name: 'Labels' });
    await input.click();
    await page.keyboard.type('Later,Soon,');
    await expect(tags(labels)).toHaveText(['Urgent', 'Later', 'Soon']);
    await page.keyboard.press('Backspace');
    await expect(labels.getByRole('row', { name: 'Soon' })).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(input).toBeFocused();
    await expect(output(page, 'Labels')).toHaveText('Urgent | Later');
    await page.keyboard.press('ArrowLeft');
    await expect(labels.getByRole('row', { name: 'Later' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(labels.getByRole('row', { name: 'Urgent' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(input).toBeFocused();
    await labels.getByRole('button', { name: 'Remove Urgent' }).click();
    await expect(input).toBeFocused();
    await expect(output(page, 'Labels')).toHaveText('Later');
  });

  test('UIC-TAGS-INPUT-3.1 UIC-TAGS-INPUT-3.2 refuses duplicates and tags past the maximum', async ({
    page,
    lab,
  }) => {
    await lab.open('tags-input');
    const cities = field(page, 'max');
    const input = cities.getByRole('textbox', { name: 'Cities' });
    await input.fill('Oslo');
    await input.press('Enter');
    await expect(input).toHaveValue('Oslo');
    await expect(cities.locator('.ui-field__message')).toHaveText('“Oslo” is already added.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(cities.locator('.ui-tags-input__group')).toHaveCSS(
      'border-top-color',
      'rgb(207, 34, 46)',
    );
    await input.fill('Paris');
    await expect(cities.locator('.ui-field__message')).toHaveText('');
    await input.press('Enter');
    await input.pressSequentially('Rome,');
    await expect(tags(cities)).toHaveText(['Oslo', 'Lima', 'Paris']);
    await expect(input).toHaveValue('Rome');
    await expect(cities.locator('.ui-field__message')).toHaveText('Add up to 3 values.');
    await cities.getByRole('button', { name: 'Remove Lima' }).click();
    await expect(cities.locator('.ui-field__message')).toHaveText('');
    await input.press('Enter');
    await expect(tags(cities)).toHaveText(['Oslo', 'Paris', 'Rome']);
  });

  test('UIC-TAGS-INPUT-3.4 shows why a tag was refused', async ({ page, lab }) => {
    await lab.open('tags-input');
    const guests = field(page, 'validate');
    const input = guests.getByRole('textbox', { name: 'Guests' });
    await input.click();
    await paste(input, 'ada@example.com, lin, sam@example.com');
    await expect(tags(guests)).toHaveText(['ada@example.com', 'sam@example.com']);
    await expect(input).toHaveValue('lin');
    await expect(input).toHaveAccessibleDescription('Enter an address like ada@example.com.');
    await lab.expectAccessible('[data-lab-field="validate"]');
  });

  test('UIC-TAGS-INPUT-2.4 UIC-TAGS-INPUT-4.3 adds on blur and focuses the input from the frame', async ({
    page,
    lab,
  }) => {
    await lab.open('tags-input');
    const toppings = field(page, 'blur');
    const frame = toppings.locator('.ui-tags-input__group');
    const box = await frame.boundingBox();
    await frame.click({ position: { x: (box?.width ?? 0) - 3, y: (box?.height ?? 0) / 2 } });
    const input = toppings.getByRole('textbox', { name: 'Toppings' });
    await expect(input).toBeFocused();
    await page.keyboard.type('Basil');
    await page.keyboard.press('Tab');
    await expect(tags(toppings)).toHaveText(['Basil']);
    await expect(input).toHaveValue('');
  });

  test('UIC-TAGS-INPUT-2.3 UIC-TAGS-INPUT-4.4 follows controlled text, restores, undoes and clears', async ({
    page,
    lab,
  }) => {
    await lab.open('tags-input');
    const keywords = field(page, 'draft').getByRole('textbox', { name: 'Keywords' });
    await keywords.pressSequentially('blue');
    await expect(output(page, 'Draft')).toHaveText('blue');
    await keywords.press('Enter');
    await expect(output(page, 'Draft')).toHaveText('empty');

    const basket = field(page, 'dirty');
    const input = basket.getByRole('textbox', { name: 'Basket' });
    await input.fill('Fig');
    await input.press('Enter');
    await expect(basket).toHaveAttribute('data-dirty', 'true');
    await basket.getByRole('button', { name: 'Restore Basket' }).click();
    await expect(tags(basket)).toHaveText(['Apple', 'Pear']);
    await expect(input).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(tags(basket)).toHaveText(['Apple', 'Pear', 'Fig']);
    await basket.getByRole('button', { name: 'Basket actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(tags(basket)).toHaveCount(0);
    // The input's own text keeps the browser's menu; the rest of the field opens the field menu.
    await basket.locator('.ui-field__label').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(tags(basket)).toHaveText(['Plum']);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved')).toHaveText('Plum');
  });

  test('UIC-TAGS-INPUT-1.2 submits each tag and blocks an empty required list', async ({
    page,
    lab,
  }) => {
    await lab.open('tags-input');
    const stops = field(page, 'form');
    const input = stops.getByRole('textbox', { name: 'Stops' });
    await page.getByRole('button', { name: 'Plan' }).click();
    await expect(input).toBeFocused();
    await expect(stops.locator('.ui-field__message')).toHaveText('A value is required.');
    await expect(output(page, 'Submitted')).toHaveText('none');
    await page.keyboard.type('Lyon, Turin');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Plan' }).click();
    await expect(output(page, 'Submitted')).toHaveText('Lyon, Turin');
  });

  test('UIC-TAGS-INPUT-1.3 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('tags-input', { theme: 'dark' });
    await expect(cell(page, 'invalid').locator('.ui-tags-input__group')).toHaveCSS(
      'border-top-color',
      'rgb(255, 123, 114)',
    );
    await lab.expectAccessible();
  });
});
