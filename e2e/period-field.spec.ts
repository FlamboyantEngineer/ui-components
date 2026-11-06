import { expect, test } from './fixtures.js';

test('UIC-PERIOD-FIELD-1.2 UIC-PERIOD-FIELD-1.3 moves through the month grid by keyboard and stops at the bounds', async ({
  page,
  lab,
}) => {
  await lab.open('period-field');
  const demo = page.locator('[data-lab-demo="billing"]');
  const trigger = demo.locator('.ui-period-field__trigger');
  await expect(trigger).toHaveText('March 2026');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const grid = page.getByRole('listbox', { name: '2026' });
  await expect(grid.getByRole('option', { name: 'March 2026' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(grid.getByRole('option', { name: 'April 2026' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(grid.getByRole('option', { name: 'July 2026' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(demo.locator('[data-lab-output="month"]')).toHaveText('2026-07');
  await trigger.click();
  const next = page.getByRole('button', { name: 'Next' });
  await next.click();
  const later = page.getByRole('listbox', { name: '2027' });
  await expect(next).toBeDisabled();
  await expect(later.getByRole('option', { name: 'March 2027' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(demo.locator('[data-lab-output="month"]')).toHaveText('2026-07');
});

test('UIC-PERIOD-FIELD-1.2 mirrors the page buttons and the arrow keys right to left', async ({
  page,
  lab,
}) => {
  await lab.open('period-field');
  const demo = page.locator('[data-lab-demo="rtl"]');
  await demo.locator('.ui-period-field__trigger').click();
  const options = page.getByRole('listbox').getByRole('option');
  await expect(options.nth(2)).toBeFocused();
  const january = await options.nth(0).boundingBox();
  const february = await options.nth(1).boundingBox();
  expect(february?.x ?? 0).toBeLessThan(january?.x ?? 0);
  await page.keyboard.press('ArrowRight');
  await expect(options.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(options.nth(2)).toBeFocused();
});
