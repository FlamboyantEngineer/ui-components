import { expect, test } from './fixtures.js';

test('UIC-NUMBER-FIELD-4.1 UIC-NUMBER-FIELD-4.2 edits the same numeric value in each base with units', async ({
  page,
  lab,
}) => {
  await lab.open('number-field');
  for (const [radix, value] of [
    ['10', '42'],
    ['2', '0b101010'],
    ['8', '0o52'],
    ['16', '0x2a'],
  ] as const) {
    const field = page.locator(`[data-lab-radix="${radix}-bytes"]`);
    await expect(field.getByRole(radix === '10' ? 'textbox' : 'spinbutton')).toHaveValue(value);
    await expect(field.locator('.ui-number-field__end')).toHaveText('B');
  }
  const hex = page.locator('[data-lab-radix="16-bytes"]').getByRole('spinbutton');
  await hex.fill('0xff');
  await hex.press('Enter');
  await expect(page.locator('[data-lab-output="Radix value"]')).toHaveText('255');
  await expect(page.locator('[data-lab-radix="2-bytes"]').getByRole('spinbutton')).toHaveValue(
    '0b11111111',
  );
  await hex.press('ArrowUp');
  await expect(hex).toHaveValue('0x100');
  await hex.fill('');
  await hex.press('Enter');
  await expect(page.locator('[data-lab-output="Radix value"]')).toHaveText('empty');
  await lab.expectAccessible('[data-lab-radix="16-bytes"]');
});

test('UIC-NUMBER-FIELD-4.2 shows keyboard focus on the frame in every base', async ({
  page,
  lab,
}) => {
  await lab.open('number-field');
  for (const radix of ['10', '2', '8', '16'] as const) {
    const field = page.locator(`[data-lab-radix="${radix}-bytes"]`);
    const group = field.locator('.ui-number-field__group');
    const input = field.getByRole(radix === '10' ? 'textbox' : 'spinbutton');
    const resting = await group.evaluate((node) => getComputedStyle(node).borderTopColor);
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(group).toHaveAttribute('data-focus-within', 'true');
    await expect(group).not.toHaveCSS('border-top-color', resting);
    await expect(group).not.toHaveCSS('outline-style', 'none');
    await input.blur();
    await expect(group).not.toHaveAttribute('data-focus-within');
  }
});
