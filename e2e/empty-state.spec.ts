import { expect, test } from './fixtures.js';

test.describe('Empty State lab', () => {
  test('UIC-EMPTY-STATE-1.2 UIC-EMPTY-STATE-1.3 draws each variant centred or start-aligned', async ({
    page,
    lab,
  }) => {
    await lab.open('empty-state');
    const cells = page.locator('table[data-lab-matrix="variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2 * 2);
    const medium = page.locator('[data-lab-cell="variant=error size=md"] .ui-empty-state').first();
    const small = page.locator('[data-lab-cell="variant=error size=sm"] .ui-empty-state').first();
    expect(await medium.evaluate((node) => getComputedStyle(node).textAlign)).toBe('center');
    expect(await small.evaluate((node) => getComputedStyle(node).textAlign)).toBe('start');
    expect(await small.evaluate((node) => getComputedStyle(node).paddingTop)).toBe('4px');
    await expect(medium.getByRole('heading', { level: 3 })).toHaveText('Unable to load cities');
    await expect(
      page
        .locator('[data-lab-cell="variant=loading size=md"] .ui-empty-state__description')
        .first(),
    ).toHaveText('Fetching the latest list…');
  });

  test('UIC-EMPTY-STATE-1.1 UIC-EMPTY-STATE-1.4 announces loading politely, then gives way to content', async ({
    page,
    lab,
  }) => {
    await lab.open('empty-state');
    const demo = page.locator('[data-lab-demo="reload"]');
    await expect(demo.getByRole('heading', { name: 'No cities' })).toBeVisible();
    await expect(demo.getByRole('status')).toHaveCount(0);
    await page.locator('[data-lab-action="reload"]').click();
    const status = demo.getByRole('status');
    await expect(status).toHaveText('Loading cities…');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).not.toHaveAttribute('aria-busy');
    const spinner = status.locator('.ui-empty-state__spinner');
    await expect(spinner).toBeVisible();
    expect(await spinner.evaluate((node) => getComputedStyle(node).width)).toBe('14px');
    await page.locator('[data-lab-action="finish"]').click();
    await expect(demo.locator('[data-lab-output="list"] li')).toHaveCount(3);
    await expect(demo.locator('.ui-empty-state')).toHaveCount(0);
    await lab.expectAccessible();
  });
});
