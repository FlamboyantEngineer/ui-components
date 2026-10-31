import { readdirSync } from 'node:fs';
import { expect, test } from './fixtures.js';

const labNames = readdirSync('labs')
  .filter((file) => file.endsWith('.html') && file !== 'index.html')
  .map((file) => file.slice(0, -'.html'.length))
  .sort();

test.describe('every lab', () => {
  // A whole-lab axe scan of the largest labs can outlast the default budget on a loaded machine.
  test.slow();
  for (const name of labNames) {
    test(`UIC-HOOKS-3.1 UIC-LABS-1.1 UIC-LABS-3.2 ${name} renders its matrices without a stylesheet`, async ({
      page,
      lab,
    }) => {
      await lab.open(name, { stylesheet: 'none' });
      await expect(page.locator('#lab-root > h1')).toBeVisible();
      await expect(page.locator('#ui-lab-stylesheet')).toHaveCount(0);
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
        'href',
        /^data:image\/svg\+xml,/,
      );
      const problems = await page.locator('table[data-lab-matrix]').evaluateAll((tables) =>
        tables.flatMap((table) => {
          const columns = table.querySelectorAll(':scope > thead > tr > th').length - 1;
          const rows = [...table.querySelectorAll(':scope > tbody > tr')];
          const cells = rows.flatMap((row) => [
            ...row.querySelectorAll(':scope > td[data-lab-cell]'),
          ]);
          const ids = cells.map((cell) => cell.getAttribute('data-lab-cell'));
          return columns > 0 &&
            rows.length > 0 &&
            rows.every((row) => row.querySelectorAll(':scope > td').length === columns) &&
            cells.length === rows.length * columns &&
            new Set(ids).size === cells.length
            ? []
            : [table.getAttribute('data-lab-matrix')];
        }),
      );
      expect(problems, 'complete matrices with unique cell addresses').toEqual([]);
    });

    // One page load scans both themes: the chrome's theme picker flips the root attribute in place.
    test(`UIC-LABS-3.4 ${name} passes axe in the light and dark themes`, async ({ page, lab }) => {
      await lab.open(name, { theme: 'light' });
      for (const theme of ['light', 'dark']) {
        await test.step(`${theme} theme`, async () => {
          await page
            .locator('#lab-chrome')
            .getByLabel('Theme', { exact: true })
            .selectOption(theme);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await lab.expectAccessible();
        });
      }
    });
  }
});
