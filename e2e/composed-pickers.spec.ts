import { expect, test } from './fixtures.js';

test('UIC-SELECT-FIELD-15.1 groups the options and returns focus after a keyboard pick', async ({
  lab,
  page,
}) => {
  await lab.open('select-field');
  const trigger = page.getByRole('button', { name: /Paper size/ });
  await trigger.focus();
  await trigger.press('ArrowDown');
  const listbox = page.getByRole('listbox');
  const a4 = listbox.getByRole('group', { name: 'Metric' }).getByRole('option', { name: 'A4' });
  await expect(a4).toBeFocused();
  await lab.expectAccessible('.ui-select-field__popover');
  await a4.press('Enter');
  await expect(trigger).toHaveAccessibleName('A4 Paper size');
  await expect(trigger).toBeFocused();
  const form = page.getByRole('form', { name: 'Paper order' });
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(form.locator('[data-lab-output="Submitted size"]')).toHaveText('a4');
});

test('UIC-COMBOBOX-7.1 picks and removes chips with composed parts', async ({ lab, page }) => {
  await lab.open('combobox');
  const input = page.getByRole('combobox', { name: 'Destinations' });
  const oslo = page.getByRole('option', { name: 'Oslo' });
  await expect(async () => {
    await input.fill('');
    await input.pressSequentially('Os');
    await expect(oslo).toBeVisible({ timeout: 1000 });
  }).toPass();
  await lab.expectAccessible('.ui-combobox__popover');
  await oslo.click();
  await input.press('Escape');
  const chips = page.getByRole('grid', { name: 'Destinations selected values' });
  await expect(chips.getByRole('button', { name: 'Remove Oslo' })).toBeVisible();
  const removeLima = chips.getByRole('button', { name: 'Remove Lima' });
  await removeLima.click();
  await expect(removeLima).toHaveCount(0);
});
