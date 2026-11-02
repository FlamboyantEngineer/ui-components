import { expect, test } from './fixtures.js';

test.describe('Markdown overrides by place', () => {
  test('UIC-MARKDOWN-2.8 draws a token by its place, hides a node with null and chains overrides', async ({
    page,
    lab,
  }) => {
    await lab.open('markdown');
    const demo = page.locator('[data-lab-demo="placed-overrides"]');
    // A button in ordinary text; plain text inside the link and the task label.
    await expect(demo.locator('[data-lab-token="button"]')).toHaveCount(1);
    await expect(demo.locator('[data-lab-token="plain"]')).toHaveCount(2);
    await expect(demo.getByRole('link').locator('button')).toHaveCount(0);
    await expect(demo.getByRole('checkbox', { name: 'Pack the pear' })).toBeVisible();
    await demo.getByRole('button', { name: 'pear' }).click();
    await demo.getByRole('button', { name: 'pear' }).click();
    await expect(demo.locator('[data-lab-output="token-presses"]')).toHaveText('Pear presses: 2');
    // The hiding override returns null for the quote, then undefined once switched off.
    await expect(demo.locator('blockquote')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Hide quotes' }).click();
    await expect(demo.locator('blockquote')).toHaveText('Internal: weigh the crates before noon.');
    await lab.expectAccessible('[data-lab-demo="placed-overrides"]');
  });
});
