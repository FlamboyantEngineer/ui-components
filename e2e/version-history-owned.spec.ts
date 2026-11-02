import { expect, test } from './fixtures.js';

test.describe('Version History lab, host-owned state', () => {
  test('UIC-VERSION-HISTORY-1.7 follows a filter owned by the host', async ({ page, lab }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="controlled-filter"]');
    const labels = demo.locator('.ui-version-history__label');
    const filter = demo.locator('[data-lab-output="filter"]');
    await expect(demo.getByRole('row')).toHaveCount(5);
    await demo.getByRole('button', { name: 'Named versions only', exact: true }).click();
    await expect(filter).toHaveText('{"namedOnly":true,"person":null}');
    await expect(labels).toHaveText(['Shared with the club', 'First plan']);
    await expect(demo.getByRole('switch', { name: 'Named versions only' })).toBeChecked();
    await demo.getByRole('button', { name: 'Only Tom Reyes' }).click();
    await expect(filter).toHaveText('{"namedOnly":true,"person":"Tom Reyes"}');
    await expect(labels).toHaveText(['Shared with the club']);
    // The toolbar reports to the same owner.
    await demo.locator('.ui-version-history__named-only').click();
    await expect(filter).toHaveText('{"namedOnly":false,"person":"Tom Reyes"}');
    await expect(demo.getByRole('row')).toHaveCount(2);
    await demo.getByRole('button', { name: 'Show every version' }).click();
    await expect(filter).toHaveText('{"namedOnly":false,"person":null}');
    await expect(demo.getByRole('row')).toHaveCount(5);
    await lab.expectAccessible('[data-lab-demo="controlled-filter"]');
  });

  test('UIC-VERSION-HISTORY-1.9 draws the host empty content with its action', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="custom-empty"]');
    await expect(demo.getByText('Nothing saved yet.')).toBeVisible();
    await demo.getByRole('button', { name: 'Save a first version' }).click();
    await expect(demo.getByRole('row')).toHaveCount(1);
    await expect(demo.getByText('Nothing saved yet.')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Clear the versions' }).click();
    await expect(demo.getByText('Nothing saved yet.')).toBeVisible();
    await lab.expectAccessible('[data-lab-demo="custom-empty"]');
  });

  test('UIC-VERSION-HISTORY-1.2 reads times in the zone and relative window given', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="time-policy"]');
    const row = (index: number) => demo.getByRole('row').nth(index);
    await expect(row(0)).toContainText('Apr 20, 2026, 9:45 AM');
    await expect(row(1)).toContainText('2 days ago');
    await expect(row(3)).toContainText('Apr 9, 2026, 8:15 AM');
    await demo.getByRole('radio', { name: 'Tokyo' }).click();
    await expect(row(0)).toContainText('Apr 20, 2026, 6:45 PM');
    await expect(row(1)).toContainText('Yesterday');
    await expect(row(4)).toContainText('Apr 3, 2026, 4:00 AM');
    await demo.getByRole('radio', { name: 'After 1 day' }).click();
    await expect(row(1)).toContainText('Apr 19, 2026, 8:30 AM');
    await expect(row(0)).toContainText('45 minutes ago');
    await demo.getByRole('radio', { name: 'After 30 days' }).click();
    await expect(row(3)).toContainText('11 days ago');
    await expect(row(4)).toContainText('17 days ago');
  });

  test('UIC-VERSION-HISTORY-1.9 loads pages, fails once and retries', async ({ page, lab }) => {
    await lab.open('version-history');
    const demo = page.locator('[data-lab-demo="paged"]');
    const requests = demo.locator('[data-lab-output="requests"]');
    const error = demo.locator('.ui-version-history__error');
    await expect(error).toContainText('Older versions could not be loaded.');
    await expect(requests).toHaveText('1 requests, 1 of 3 pages');
    await error.getByRole('button', { name: 'Retry' }).click();
    await expect(requests).toHaveText('3 requests, 3 of 3 pages');
    await expect(demo.getByRole('row')).toHaveCount(9);
    await expect(demo.getByRole('row', { name: /Draft 1\b/ })).toBeAttached();
    await expect(demo.locator('.ui-list-view__loader')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="paged"]');
    await demo.getByRole('button', { name: 'Start again' }).click();
    await expect(error).toBeVisible();
    await expect(requests).toHaveText('1 requests, 1 of 3 pages');
  });
});
