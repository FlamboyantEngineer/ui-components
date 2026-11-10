import { expect, test } from './fixtures.js';

test('UIC-TIME-ZONE-FIELD-1.1 UIC-TIME-ZONE-FIELD-1.2 orders zones by offset at the reference month and finds them by name, id or offset', async ({
  page,
  lab,
}) => {
  await lab.open('time-zone-field');
  const demo = page.locator('[data-lab-demo="supported"]');
  const trigger = demo.locator('.ui-select-field__trigger');
  await expect(trigger).toContainText('Australia/Lord Howe');
  await trigger.click();
  const option = (name: RegExp) => page.getByRole('listbox').getByRole('option', { name });
  // The list is virtualized and opens scrolled to the chosen zone, so a zone far from it is found
  // by searching rather than expected among the rendered rows.
  const search = page.getByRole('searchbox');
  await expect(option(/Lord Howe/)).toContainText('GMT+11:00');
  await search.fill('new york');
  await expect(option(/New York/)).toContainText('GMT-05:00');
  await page.keyboard.press('Escape');
  await demo.getByRole('radio', { name: 'July' }).click();
  await trigger.click();
  await expect(option(/Lord Howe/)).toContainText('GMT+10:30');
  await search.fill('new york');
  await expect(option(/New York/)).toContainText('GMT-04:00');
  await search.fill('india');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(1);
  await search.fill('+05:45');
  await option(/Kathmandu/).click();
  await expect(demo.locator('[data-lab-output="zone"]')).toHaveText('Asia/Kathmandu');
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('Asia/Kathmandu');
});

test('UIC-TIME-ZONE-FIELD-1.2 lists every platform zone in a virtualized list and moves by keyboard', async ({
  page,
  lab,
}) => {
  await lab.open('time-zone-field');
  const trigger = page.getByRole('button', { name: /Meeting zone$/ });
  await trigger.click();
  const options = page.getByRole('listbox').getByRole('option');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(options.first()).toBeVisible();
  expect(await options.count()).toBeLessThan(100);
  await page.keyboard.type('tokyo');
  await expect(options).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('Asia/Tokyo');
});
