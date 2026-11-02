import { expect, test } from './fixtures.js';

test('UIC-SEGMENTED-CHOICE-1.8 keeps keyboard choice, state and form value on a swapped root', async ({
  page,
  lab,
}) => {
  await lab.open('segmented-choice');
  const form = page.getByRole('form', { name: 'Calendar view' });
  const root = form.locator('[data-lab-root="framed"]');
  await expect(root).toHaveClass(/ui-segmented-choice/);
  await expect(root).toHaveAttribute('data-lab-root-state', 'horizontal');
  await form.getByRole('radio', { name: 'Week' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(form.getByRole('radio', { name: 'Month' })).toBeChecked();
  await expect(page.locator('[data-lab-output="View"]')).toHaveText('month');
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('[data-lab-output="Calendar view submitted"]')).toHaveText(
    'view=month',
  );
  await form.getByText('Disable the choice').click();
  await expect(root).toHaveAttribute('data-lab-root-state', 'horizontal, disabled');
});
