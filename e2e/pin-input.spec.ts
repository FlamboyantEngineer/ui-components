import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, layout = 'label-control'): Locator {
  return page.locator(`[data-lab-cell="state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function cells(scope: Locator): Locator {
  return scope.locator('.ui-pin-input__cell');
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

async function readValues(scope: Locator): Promise<string[]> {
  return cells(scope).evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
}

test.describe('Pin Input lab', () => {
  test('UIC-PIN-INPUT-1.1 UIC-PIN-INPUT-1.2 lays the named cells out in a row for each state', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const resting = cell(page, 'resting');
    const group = resting.getByRole('group', { name: 'PIN' });
    await expect(group.getByRole('textbox')).toHaveCount(4);
    const boxes = await Promise.all(
      [0, 1, 2, 3].map((index) => cells(resting).nth(index).boundingBox()),
    );
    for (const [index, box] of boxes.entries()) {
      expect(box?.width).toBe(32);
      expect(box?.height).toBe(36);
      expect(box?.y).toBe(boxes[0]?.y);
      if (index > 0) expect(box?.x ?? 0).toBeGreaterThan(boxes[index - 1]?.x ?? 0);
    }
    await expect(group.getByRole('textbox', { name: 'Character 3 of 4' })).toHaveValue('6');
    await expect(resting.locator('.ui-pin-input')).toHaveAttribute('data-complete', 'true');

    const required = cells(cell(page, 'required')).first();
    await expect(required).toHaveAttribute('aria-invalid', 'true');
    await expect(required).toHaveAccessibleDescription('A value is required.');
    await expect(cells(cell(page, 'read-only')).first()).toHaveAttribute('readonly', '');
    await expect(cells(cell(page, 'disabled')).first()).toBeDisabled();
    await expect(
      cell(page, 'resting', 'control-only').getByRole('group', { name: 'PIN' }),
    ).toBeVisible();
    await cell(page, 'resting').getByText('PIN', { exact: true }).click();
    await expect(cells(resting).first()).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-PIN-INPUT-2.1 UIC-PIN-INPUT-2.5 types a code and completes once per code', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const otp = field(page, 'otp');
    await cells(otp).first().click();
    await page.keyboard.type('13579');
    await expect(cells(otp).nth(5)).toBeFocused();
    await expect(output(page, 'Completed')).toHaveText('none');
    await page.keyboard.type('1');
    await expect(output(page, 'Completed')).toHaveText('135791');
    await expect(otp.locator('.ui-field__message')).toHaveText('That code is not right.');
    await expect(otp).toHaveAttribute('data-complete', 'true');
    await page.keyboard.type('1');
    await expect(output(page, 'Completed')).toHaveText('135791');
    await page.keyboard.press('Backspace');
    await expect(cells(otp).nth(4)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('0');
    await expect(output(page, 'Completed')).toHaveText('135791, 135790');
    await expect(output(page, 'Verified')).toHaveText('yes');
    await expect(otp.locator('.ui-field__message')).toHaveText('');
  });

  test('UIC-FIELD-1.9 UIC-FIELD-1.11 UIC-PIN-INPUT-2.5 keeps an edited code until focus leaves the field', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const otp = field(page, 'otp');
    await cells(otp).first().click();
    await page.keyboard.type('1');
    await cells(otp).first().click();
    await expect(cells(otp).first()).toBeFocused();
    await expect(otp).not.toHaveAttribute('data-touched');
    await page.keyboard.press('End');
    await page.keyboard.press('Tab');
    await expect(otp.getByRole('button', { name: 'Restore Verification code' })).toBeFocused();
    await expect(otp).toHaveAttribute('data-dirty', 'true');
    await expect(otp).not.toHaveAttribute('data-touched');
    await page.keyboard.press('Tab');
    await expect(otp.locator(':focus')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.localName)).not.toBe('body');
    await expect(otp).not.toHaveAttribute('data-dirty');
    await expect(otp).toHaveAttribute('data-touched', 'true');
  });

  test('UIC-PIN-INPUT-2.4 fills the cells from the focused one with a paste', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const otp = field(page, 'otp');
    await cells(otp).first().click();
    await page.keyboard.type('12');
    await paste(cells(otp).nth(2), '35-79-0-8');
    expect(await readValues(otp)).toEqual(['1', '2', '3', '5', '7', '9']);
    await expect(cells(otp).nth(5)).toBeFocused();
    await expect(output(page, 'Completed')).toHaveText('123579');
  });

  test('UIC-PIN-INPUT-2.2 UIC-PIN-INPUT-2.3 erases, moves and keeps one cell in the tab order', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const otp = field(page, 'otp');
    await cells(otp).nth(4).click();
    await expect(cells(otp).first()).toBeFocused();
    await page.keyboard.type('2468');
    await page.keyboard.press('Home');
    await expect(cells(otp).first()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Backspace');
    expect(await readValues(otp)).toEqual(['2', '6', '8', '', '', '']);
    await expect(cells(otp).first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(cells(otp).nth(3)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(otp.locator(':focus')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(cells(otp).nth(3)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(otp.locator(':focus')).toHaveCount(0);
  });

  test('UIC-PIN-INPUT-1.3 UIC-PIN-INPUT-1.4 takes only its characters and masks them', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const numeric = page.locator('[data-lab-cell="type=numeric look=placeholder"]');
    await expect(cells(numeric).first()).toHaveAttribute('placeholder', '○');
    await expect(cells(numeric).first()).toHaveAttribute('inputmode', 'numeric');
    await cells(numeric).first().click();
    await page.keyboard.type('a1b2');
    expect(await readValues(numeric)).toEqual(['1', '2', '', '']);
    const letters = page.locator('[data-lab-cell="type=alphabetic look=placeholder"]');
    await cells(letters).first().click();
    await page.keyboard.type('a1b2');
    expect(await readValues(letters)).toEqual(['a', 'b', '', '']);
    const masked = page.locator('[data-lab-cell="type=numeric look=masked"]');
    await expect(cells(masked).first()).toHaveAttribute('type', 'password');
  });

  test('UIC-PIN-INPUT-2.7 UIC-PIN-INPUT-1.6 restores, undoes, clears, submits and resets', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    const door = field(page, 'dirty');
    await cells(door).nth(3).click();
    await page.keyboard.type('9');
    await expect(door).toHaveAttribute('data-dirty', 'true');
    await door.getByRole('button', { name: 'Restore Door code' }).click();
    expect(await readValues(door)).toEqual(['1', '3', '5', '7']);
    await expect(cells(door).first()).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    expect(await readValues(door)).toEqual(['1', '3', '5', '9']);
    await door.getByRole('button', { name: 'Door code actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    expect(await readValues(door)).toEqual(['', '', '', '']);

    const pin = field(page, 'form');
    await cells(pin).first().click();
    await page.keyboard.type('42');
    await page.getByRole('button', { name: 'Unlock', exact: true }).click();
    await expect(pin.locator('.ui-field__message')).toHaveText('Use at least 4 characters.');
    await expect(cells(pin).first()).toBeFocused();
    await expect(output(page, 'Submitted')).toHaveText('none');
    await page.keyboard.press('End');
    await page.keyboard.type('42');
    await page.getByRole('button', { name: 'Unlock', exact: true }).click();
    await expect(output(page, 'Submitted')).toHaveText('4242');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect.poll(() => readValues(pin)).toEqual(['', '', '', '']);
  });

  test('UIC-PIN-INPUT-1.2 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('pin-input', { theme: 'dark' });
    await expect(cells(cell(page, 'invalid')).first()).toHaveCSS(
      'border-top-color',
      'rgb(255, 123, 114)',
    );
    await lab.expectAccessible();
  });
});
