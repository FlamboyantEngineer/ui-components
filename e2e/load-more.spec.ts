import { expect, test } from './fixtures.js';

test.describe('Load More lab', () => {
  test('UIC-LOAD-MORE-1.1 UIC-LOAD-MORE-1.2 UIC-LOAD-MORE-1.3 draws small buttons with counts and names', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const counted = page.locator('[data-lab-cell="state=idle count=12 remaining"] .ui-load-more');
    await expect(counted).toHaveText('Load more (12 remaining)');
    await expect(counted).toHaveAccessibleName('Load more (12 remaining) messages');
    await expect(counted).toHaveClass(/ui-button/);
    const box = await counted.boundingBox();
    expect(box?.height).toBe(26);
    await expect(page.locator('[data-lab-cell="state=idle count=zero"] .ui-load-more')).toHaveText(
      'Load more (0 remaining)',
    );
    await expect(
      page.locator('[data-lab-cell="state=disabled count=no count"] .ui-load-more'),
    ).toBeDisabled();
    const pending = page.locator('[data-lab-cell="state=pending count=no count"] .ui-load-more');
    await expect(pending).toHaveAttribute('aria-disabled', 'true');
    await expect(pending.locator('.ui-button__spinner')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-LOAD-MORE-1.4 pages by keyboard, keeps focus while pending and refuses repeats', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const demo = page.locator('[data-lab-demo="paged"]');
    const items = demo.locator('[data-lab-output="items"] li');
    const button = demo.locator('[data-lab-action="load"]');
    const deliver = demo.locator('[data-lab-action="deliver"]');
    await expect(items).toHaveCount(4);
    await expect(button).toHaveText('Load more (8 remaining)');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('data-pending', 'true');
    await expect(button).toBeFocused();
    await expect(button).toHaveText('Load more (8 remaining)');
    await page.keyboard.press(' ');
    await page.keyboard.press('Enter');
    await deliver.click();
    await expect(items).toHaveCount(8);
    await expect(button).not.toHaveAttribute('data-pending');
    await expect(button).toHaveText('Load more (4 remaining)');
    await expect(deliver).toBeDisabled();
    await button.focus();
    await page.keyboard.press(' ');
    await expect(button).toHaveAttribute('data-pending', 'true');
    await deliver.click();
    await expect(items).toHaveCount(12);
    await expect(demo.locator('[data-lab-output="done"]')).toBeVisible();
    await expect(button).toHaveCount(0);
  });
});
