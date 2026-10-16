import { expect, test } from '@playwright/test';

test('the lab index loads from static files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('index.html');
  await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
  await expect(page.getByRole('heading', { level: 1, name: 'Labs' })).toBeVisible();
  expect(errors).toEqual([]);
});
