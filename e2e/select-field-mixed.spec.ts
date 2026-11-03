import { expect, test } from './fixtures.js';

test('UIC-SELECT-FIELD-3.4 mixed choices retain, add and remove while the list remains open', async ({
  page,
  lab,
}) => {
  await lab.open('select-field');
  await page.getByRole('button', { name: /Shared labels$/ }).click();
  const mixed = page.getByRole('option', { name: /Green Mixed values/ });
  await expect(mixed.locator('.ui-select-field__option-check')).toHaveAttribute(
    'data-indeterminate',
    'true',
  );
  await mixed.click();
  await expect(page.getByRole('option', { name: 'Green', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Enter');
  await expect(page.getByRole('option', { name: 'Green', exact: true })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await page.keyboard.press('Enter');
  await expect(mixed.locator('.ui-select-field__option-check')).toHaveAttribute(
    'data-indeterminate',
    'true',
  );
});
