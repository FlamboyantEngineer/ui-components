import { expect, test } from './fixtures.js';

test('UIC-TRACE-1.1 draws each line status in its own treatment', async ({ page, lab }) => {
  await lab.open('trace');
  const colorOf = (status: string) =>
    page
      .getByRole('group', { name: `${status} trace` })
      .locator('.ui-trace__line')
      .evaluate((line) => getComputedStyle(line).color);
  const done = await colorOf('done');
  expect(await colorOf('error')).not.toBe(done);
  const pending = page.getByRole('group', { name: 'pending trace' }).locator('.ui-trace__line');
  await expect(pending).toHaveAttribute('data-status', 'pending');
  const icon = pending.locator('.ui-trace__icon');
  expect(Number(await icon.evaluate((glyph) => getComputedStyle(glyph).opacity))).toBeLessThan(1);
  const titleColor = (status: string) =>
    page
      .getByRole('group', { name: `${status} trace` })
      .locator('.ui-trace__title')
      .evaluate((title) => getComputedStyle(title).color);
  expect(await titleColor('running')).not.toBe(await titleColor('done'));
  await lab.expectAccessible();
});

test('UIC-TRACE-2.1 opens a step’s details under a start rule', async ({ page, lab }) => {
  await lab.open('trace');
  const steps = page.getByRole('group', { name: 'collapsed steps' });
  const trigger = steps.getByRole('button', { name: 'Thought for 4s' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const details = steps.getByRole('group', { name: 'Thought for 4s' });
  await expect(details).toBeVisible();
  const rule = await details.evaluate((panel) => getComputedStyle(panel).borderInlineStartWidth);
  expect(rule).toBe('1px');
  const opened = page.getByRole('group', { name: 'expanded steps' });
  await expect(opened.getByRole('group', { name: 'Thought for 4s' })).toBeVisible();
  await lab.expectAccessible();
});
