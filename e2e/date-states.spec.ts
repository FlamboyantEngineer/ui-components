import { expect, test } from './fixtures.js';

test('UIC-DATE-TIME-FIELD-3.4 shows calendar highlights, fades other months and strikes only taken dates', async ({
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

test('UIC-DATE-TIME-FIELD-3.4 keeps unavailable days marked through range picks and reopening', async ({
  page,
  lab,
}) => {
  await lab.open('date-time-field');
  const field = page.locator('[data-lab-field="date-states-range"]');
  const open = () => field.getByRole('button', { name: /Calendar/ }).click();
  const dialog = page.getByRole('dialog');
  const day = (name: string) => dialog.getByRole('button', { name: new RegExp(name) });
  const marked = async () => {
    for (const name of [
      'Tuesday, April 14, 2026',
      'Thursday, April 16, 2026',
      'Saturday, April 18, 2026',
    ]) {
      await expect(day(name)).toHaveAttribute('data-unavailable', 'true');
      await expect(day(name)).toHaveCSS('background-image', /repeating-linear-gradient/);
    }
    await expect(day('Thursday, April 16, 2026')).toHaveAttribute('data-taken', 'true');
    await expect(day('Tuesday, April 14, 2026')).toHaveAttribute('data-tone', 'danger');
  };
  await open();
  await marked();

  // Dragging from a weekday across the weekend is refused: the days past it cannot be reached,
  // but they stay apart from the days that are unavailable.
  const start = await day('Wednesday, April 8, 2026').boundingBox();
  const end = await day('Wednesday, April 15, 2026').boundingBox();
  if (!start || !end) throw new Error('calendar not drawn');
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
  const unreachable = day('Monday, April 13, 2026');
  await expect(unreachable).toHaveAttribute('data-disabled', 'true');
  await expect(unreachable).not.toHaveAttribute('data-unavailable');
  await expect(unreachable).toHaveCSS('background-image', 'none');
  await marked();
  await page.mouse.up();
  await expect(field.getByRole('group').first()).toContainText('4/6/2026');
  await marked();

  await day('Thursday, April 9, 2026').click();
  await expect(dialog).toHaveCount(0);
  await expect(field.getByRole('group').first()).toContainText('4/8/2026');
  await expect(field.getByRole('group').first()).toContainText('4/9/2026');
  await open();
  await marked();
  await expect(day('Monday, April 13, 2026')).not.toHaveAttribute('data-disabled');
  await dialog.getByRole('button', { name: 'Next', exact: true }).first().click();
  await dialog.getByRole('button', { name: 'Previous', exact: true }).first().click();
  await marked();
});
