import { expect, test } from './fixtures.js';

test.describe('Action Button lab', () => {
  test('UIC-ACTION-BUTTON-1.1 UIC-ACTION-BUTTON-1.2 runs once per press until it settles', async ({
    page,
    lab,
  }) => {
    await lab.open('action-button');
    const save = page.locator('[data-lab-action="save"]');
    await save.click();
    await expect(save).toHaveAttribute('data-pending', 'true');
    await save.click({ force: true });
    await save.press('Enter');
    await page.locator('[data-lab-action="finish"]').click();
    await expect(save).not.toHaveAttribute('data-pending', 'true');
    await expect(page.locator('[data-lab-output="runs"]')).toHaveText('1');
    await lab.expectAccessible();
  });

  test('UIC-ACTION-BUTTON-1.3 returns to idle after a rejection and reports it', async ({
    page,
    lab,
  }) => {
    await lab.open('action-button');
    const upload = page.locator('[data-lab-action="fail"]');
    await upload.click();
    await expect(upload).toHaveAttribute('data-pending', 'true');
    await page.locator('[data-lab-action="reject"]').click();
    await expect(upload).not.toHaveAttribute('data-pending', 'true');
    await expect(page.locator('[data-lab-output="error"]')).toHaveText('Error: The request failed');
  });
});
