import { expect, test } from './fixtures.js';

test('UIC-INPUT-GROUP-1.1 UIC-INPUT-GROUP-1.2 places addons around the control and keeps button focus', async ({
  lab,
  page,
}) => {
  await lab.open('input-group');
  const domain = page.getByRole('textbox', { name: 'Domain' });
  const prefix = page.getByText('https://');
  const clear = page.getByRole('button', { name: 'Clear domain' });
  const message = page.getByRole('textbox', { name: 'Message' });
  await expect(prefix.locator('..')).toHaveCSS('order', '-1');
  await expect(clear.locator('..')).toHaveCSS('order', '1');
  await expect(page.getByText('At least three characters').locator('..')).toHaveCSS('order', '-2');
  await expect(page.getByRole('button', { name: 'Send' }).locator('..')).toHaveCSS('order', '2');
  await prefix.click();
  await expect(domain).toBeFocused();
  await domain.fill('example.com');
  await clear.click();
  await expect(clear).toBeFocused();
  await expect(domain).toHaveValue('');
  await page.getByText('At least three characters').click();
  await expect(message).toBeFocused();
});

test('UIC-INPUT-GROUP-2.1 runs native constraints and sends from the textarea and button', async ({
  lab,
  page,
}) => {
  await lab.open('input-group');
  const message = page.getByRole('textbox', { name: 'Message' });
  await message.pressSequentially('Hi');
  await message.press('Enter');
  await expect(message).toHaveValue('Hi');
  expect(await message.evaluate((element) => element.matches(':invalid'))).toBe(true);
  await message.press('Shift+Enter');
  await message.pressSequentially('there');
  await message.press('Enter');
  await expect(message).toHaveValue('');
  await expect(page.getByText(/Sent: Hi\s+there/)).toBeVisible();

  await message.fill('A second prompt');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Sent: A second prompt')).toBeVisible();
});
