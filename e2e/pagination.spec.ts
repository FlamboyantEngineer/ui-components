import { expect, test } from './fixtures.js';

test.describe('Pagination lab', () => {
  test('UIC-PAGINATION-1.1 UIC-PAGINATION-1.3 pages a list by pointer and keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('pagination');
    const root = page.locator('[data-lab="paged"]');
    const nav = root.getByRole('navigation', { name: 'City pages' });
    const list = root.locator('[data-lab-output]');
    await expect(list).toHaveText('LisbonOslo');
    await nav.getByRole('button', { name: 'Page 3' }).click();
    await expect(list).toHaveText('PortoSeville');
    await expect(nav.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    const next = nav.getByRole('button', { name: 'Next page' });
    await next.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(list).toHaveText('Lima');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(nav.getByRole('button', { name: 'Page 5' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Space');
    await expect(list).toHaveText('NapierIzmir');
    await lab.expectAccessible();
  });

  test('UIC-PAGINATION-1.4 shows gaps for skipped pages in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('pagination', { theme: 'dark' });
    const middle = page.getByRole('navigation', { name: 'Pages, middle page' });
    await expect(middle.getByRole('button', { name: /^Page / })).toHaveText([
      '1',
      '5',
      '6',
      '7',
      '12',
    ]);
    await expect(middle.locator('.ui-pagination__ellipsis')).toHaveCount(2);
    await lab.expectAccessible();
  });
});
