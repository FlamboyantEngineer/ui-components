import { expect, test } from './fixtures.js';

test('UIC-CHOICE-GROUP-3.2 focuses each choice’s native input through inputRef', async ({
  page,
  lab,
}) => {
  await lab.open('choice-group');
  const output = page.locator('[data-lab-output="Focused input"]');
  await page.getByRole('button', { name: 'Focus Express courier' }).click();
  const courier = page.getByRole('radio', { name: 'Express courier' });
  await expect(courier).toBeFocused();
  await expect(output).toHaveText('radio input "courier"');
  await page.keyboard.press('Space');
  await expect(courier).toBeChecked();
  await page.getByRole('button', { name: 'Focus Handwritten note' }).click();
  const note = page.getByRole('checkbox', { name: 'Handwritten note' });
  await expect(note).toBeFocused();
  await expect(output).toHaveText('checkbox input "note"');
  await page.keyboard.press('Space');
  await expect(note).toBeChecked();
});
