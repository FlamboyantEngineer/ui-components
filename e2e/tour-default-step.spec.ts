import { expect, test } from './fixtures.js';

test.describe('Tour lab default step', () => {
  test('UIC-TOUR-2.3 UIC-TOUR-2.4 opens at defaultStep, walks from it and starts there again', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const start = page.locator('[data-lab-start="later"]');
    const tour = page.locator('[data-lab-tour="later"]');
    const log = page.locator('[data-lab-output="later-log"]');

    await start.click();
    await expect(page.getByRole('dialog', { name: 'Your recipes' })).toBeVisible();
    await expect(tour.locator('.ui-tour__progress')).toHaveText('3 of 4');
    await tour.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await tour.getByRole('button', { name: 'Next' }).click();
    await tour.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('dialog', { name: 'Share' })).toBeVisible();
    await tour.getByRole('button', { name: 'Finish' }).click();
    await expect(tour).toHaveCount(0);
    await expect(log).toHaveText('opened, step 2, step 3, step 4, closed');

    await start.click();
    await expect(page.getByRole('dialog', { name: 'Your recipes' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(log).toHaveText('opened, step 2, step 3, step 4, closed, opened, closed');
  });
});
