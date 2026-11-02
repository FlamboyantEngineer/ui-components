import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);
const text = (page: Page, name: string) => page.locator(`[data-lab-text="${name}"]`);

test.describe('Truncation Tooltip lab coverage', () => {
  test('UIC-TRUNCATION-TOOLTIP-2.1 follows host-controlled expansion and a wide column', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const area = page.locator('[data-lab-demo="controlled-expansion"]');
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

  test('UIC-TRUNCATION-TOOLTIP-2.1 starts whole with defaultExpanded', async ({ page, lab }) => {
    await lab.open('truncation-tooltip');
    const label = text(page, 'default-expanded');
    await expect(label).toHaveAttribute('data-expanded');
    await page
      .locator('[data-lab-section="Starts whole"]')
      .getByRole('button', { name: 'Show less' })
      .click();
    await expect(label).not.toHaveAttribute('data-expanded');
  });

  test('UIC-TRUNCATION-TOOLTIP-1.2 waits for the hover delay before opening', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    await text(page, 'delayed').hover();
    // The page's other tooltips stay closed; this one waits 1500 ms.
    await page.waitForTimeout(800);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(page.getByRole('tooltip')).toHaveText(/Quarterly report/, { timeout: 3000 });
  });
});
