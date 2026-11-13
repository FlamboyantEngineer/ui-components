import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

test.describe('Chart options lab', () => {
  test('UIC-CHART-1.2 UIC-CHART-1.3 UIC-CHART-2.1 switches every chart to its table, summary and hidden series together', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const shared = demo(page, 'shared-options');
    await expect(shared.getByRole('table')).toHaveCount(0);
    await shared.getByText('Tables', { exact: true }).click();
    await expect(shared.getByRole('table')).toHaveCount(5);
    await expect(shared.locator('[data-lab-output="view"]')).toHaveText('table');

    await shared.getByText('Show summaries', { exact: true }).click();
    await expect(shared.getByText('North sells more than South in every quarter.')).toBeVisible();

    await shared.getByText('Tables', { exact: true }).click();
    await shared.getByText('Hide South', { exact: true }).click();
    await expect(shared.locator('.ui-bar-chart__legend, .ui-chart-legend').first()).toBeVisible();
  });

  test('UIC-CHART-4.7 UIC-CHART-1.3 opens a chart on its table, with its own value writer', async ({
    page,
    lab,
  }) => {
    await lab.open('chart');
    const bars = demo(page, 'bar-formats');
    await expect(bars.getByRole('table')).toBeVisible();
    await expect(bars.getByRole('table')).toContainText('North: 1200 €');

    const frame = demo(page, 'frame-view');
    await expect(frame.getByRole('table')).toBeVisible();
    await expect(frame.locator('[data-lab-output="frame view"]')).toHaveText('table');
  });
});
