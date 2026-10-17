import { expect, test } from './fixtures.js';

test.describe('Meta Line lab', () => {
  test('UIC-META-LINE-1.1 UIC-META-LINE-1.2 separates only real entries with a hidden middot', async ({
    page,
    lab,
  }) => {
    await lab.open('meta-line');
    await expect(page.locator('[data-lab-cell="entries=none container=wide"] *')).toHaveCount(0);
    const line = page.locator(
      '[data-lab-cell="entries=empty entries container=wide"] .ui-meta-line',
    );
    await expect(line).toHaveText('Lisbon · Portugal');
    await expect(line.locator('.ui-meta-line__separator')).toHaveCount(1);
    await expect(
      page.locator('[data-lab-cell="entries=zero container=wide"] .ui-meta-line'),
    ).toHaveText('Orchard · 0 · crates left');
    const snapshot = await line.ariaSnapshot();
    expect(snapshot).toContain('Lisbon');
    expect(snapshot).not.toContain('·');
    expect(await line.evaluate((node) => getComputedStyle(node).display)).toBe('inline');
  });

  test('UIC-META-LINE-1.1 keeps a node entry and its state while entries change', async ({
    page,
    lab,
  }) => {
    await lab.open('meta-line');
    const demo = page.locator('[data-lab-toggle]');
    const counter = demo.getByRole('button', { name: /Clicked/ });
    await counter.click();
    await counter.click();
    await demo.getByRole('checkbox', { name: 'Show the leading entry' }).uncheck();
    await expect(demo.locator('.ui-meta-line')).toHaveText('Clicked 2 · 3 notes');
    await expect(demo.locator('code')).toHaveText('3 notes');
    await counter.focus();
    await page.keyboard.press('Enter');
    await expect(counter).toHaveText('Clicked 3');
    await lab.expectAccessible();
  });
});
