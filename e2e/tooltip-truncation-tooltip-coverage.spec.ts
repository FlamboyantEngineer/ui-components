import type { Page } from '@playwright/test';
import { expect, matrix, test } from './fixtures.js';

/** The truncation panel is portalled beside other families' controlled tooltips. */
const tooltip = (page: Page) =>
  page.getByRole('tooltip').and(page.locator('.ui-truncation-tooltip__panel'));

const output = (page: Page, name: string) =>
  matrix(page, 'truncation-tooltip').locator(`[data-lab-output="${name}"]`);
const text = (page: Page, name: string) =>
  matrix(page, 'truncation-tooltip').locator(`[data-lab-text="${name}"]`);

test.describe('Truncation Tooltip lab coverage', () => {
  test('UIC-TOOLTIP-4.1 follows host-controlled expansion and a wide column', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const area = matrix(page, 'truncation-tooltip').locator(
      '[data-lab-demo="controlled-expansion"]',
    );
    const label = text(page, 'controlled');
    await area.getByRole('button', { name: 'Show more' }).click();
    await expect(label).toHaveAttribute('data-expanded');
    await expect(output(page, 'Expansion requests')).toHaveText('show more');
    await area.getByRole('button', { name: 'Collapse from the host' }).click();
    await expect(label).not.toHaveAttribute('data-expanded');
    await expect(area.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await area.getByRole('button', { name: 'Expand from the host' }).click();
    await expect(area.getByRole('button', { name: 'Show less' })).toBeVisible();
    await area.getByRole('button', { name: 'Show less' }).click();
    await expect(output(page, 'Expansion requests')).toHaveText('show more, show less');
    await expect(output(page, 'Expanded')).toHaveText('false');

    await area.getByText('Wide column').click();
    await expect(area.getByRole('button', { name: 'Show more' })).toHaveCount(0);
    await area.getByText('Wide column').click();
    await expect(area.getByRole('button', { name: 'Show more' })).toBeVisible();
  });

  test('UIC-TOOLTIP-4.1 starts whole with defaultExpanded', async ({ page, lab }) => {
    await lab.open('tooltip');
    const label = text(page, 'default-expanded');
    await expect(label).toHaveAttribute('data-expanded');
    await page
      .locator('[data-lab-section="Starts whole"]')
      .getByRole('button', { name: 'Show less' })
      .click();
    await expect(label).not.toHaveAttribute('data-expanded');
  });

  test('UIC-TOOLTIP-3.2 waits for the hover delay before opening', async ({ page, lab }) => {
    await lab.open('tooltip');
    await text(page, 'delayed').hover();
    // The page's other tooltips stay closed; this one waits 1500 ms.
    await page.waitForTimeout(800);
    await expect(tooltip(page)).toHaveCount(0);
    await expect(tooltip(page)).toHaveText(/Quarterly report/, { timeout: 3000 });
  });
});
