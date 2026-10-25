import { expect, test } from './fixtures.js';

test('UIC-DATE-TIME-FIELD-3.5 shows calendar highlights, fades other months and strikes only taken dates', async ({
  page,
  lab,
}) => {
  await lab.open('date-time-field');
  await page
    .locator('[data-lab-field="date-states"]')
    .getByRole('button', { name: /Calendar/ })
    .click();
  const dialog = page.getByRole('dialog');
  const holiday = dialog.getByRole('button', { name: /Friday, April 10, 2026/ });
  await expect(holiday).toHaveAttribute('data-tone', 'success');
  await expect(holiday).toHaveAccessibleDescription('Spring holiday');
  const taken = dialog.getByRole('button', { name: /Thursday, April 16, 2026/ });
  await expect(taken).toHaveAttribute('aria-disabled', 'true');
  await expect(taken).toHaveCSS('text-decoration-line', 'line-through');
  const closed = dialog.getByRole('button', { name: /Tuesday, April 14, 2026/ });
  await expect(closed).toHaveAttribute('aria-disabled', 'true');
  await expect(closed).toHaveCSS('text-decoration-line', 'none');
  const outside = dialog.locator('.ui-date-time-field__calendar-cell[data-outside-month]').first();
  await expect(outside).toHaveCSS('text-decoration-line', 'none');
  await expect(dialog.locator('xpath=..')).not.toHaveAttribute('data-entering', /.*/);
  await lab.expectAccessible('.ui-date-time-field__dialog');
});
