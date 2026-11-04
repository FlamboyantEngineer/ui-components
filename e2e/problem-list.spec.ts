import { expect, matrixCell, test } from './fixtures.js';

test.describe('Problem List lab', () => {
  test('UIC-PROBLEM-LIST-1.1 UIC-PROBLEM-LIST-2.1 counts problems by severity in every content', async ({
    page,
    lab,
  }) => {
    await lab.open('problem-list');
    const cell = (content: string, target: string) =>
      matrixCell(page, `content=${content} target=${target}`).locator(`.ui-problem-list`);
    await expect(cell('empty', 'plain')).toHaveAttribute('data-empty', 'true');
    await expect(cell('empty', 'plain').getByRole('status')).toHaveText('No problems');
    await expect(cell('mixed', 'plain').getByRole('status')).toHaveText('3 errors, 1 warning');
    await expect(cell('warnings', 'jump')).toHaveAttribute('data-severity', 'warning');
    await expect(cell('errors', 'plain').getByRole('button')).toHaveCount(0);
    await expect(cell('errors', 'jump').getByRole('button')).toHaveCount(2);
    await lab.expectAccessible();
  });

  test('UIC-PROBLEM-LIST-1.3 UIC-PROBLEM-LIST-1.4 collects a form fields problems and jumps to them', async ({
    page,
    lab,
  }) => {
    await lab.open('problem-list');
    const form = page.locator('[data-lab-form="booking"]');
    const list = form.locator('.ui-problem-list');
    await expect(list.getByRole('status')).toHaveText('No problems');
    await form.getByRole('button', { name: 'Book' }).click();
    await expect(list.getByRole('status')).toHaveText('2 errors, 1 warning');
    await expect(list.locator('.ui-problem-list__item')).toHaveText([
      'Error: Name A value is required.',
      'Warning: Email Check the address; it has no @.',
      'Error: Seats A value is required.',
    ]);
    await list.getByRole('button', { name: /Seats/ }).click();
    await expect(form.getByRole('textbox', { name: 'Seats' })).toBeFocused();
    await page.keyboard.type('3');
    await form.getByRole('textbox', { name: 'Name' }).fill('Ana');
    await form.getByRole('textbox', { name: 'Email' }).fill('ana@example.com');
    await expect(list.getByRole('status')).toHaveText('No problems');
    await form.getByRole('button', { name: 'Book' }).click();
    await expect(page.locator('[data-lab-output="booked"]')).toHaveText('Ana × 3');
    await lab.expectAccessible();
  });

  test('UIC-PROBLEM-LIST-1.3 moves focus to a document section and reports the problem', async ({
    page,
    lab,
  }) => {
    await lab.open('problem-list');
    const checks = page.locator('[data-lab-document="checks"]');
    await checks.getByRole('button', { name: /Risks/ }).click();
    await expect(checks.getByRole('heading', { name: 'Risks' })).toBeFocused();
    await expect(page.locator('[data-lab-output="picked"]')).toHaveText('risks');
  });
});
