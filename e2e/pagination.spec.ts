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

  test('UIC-PAGINATION-1.2 keeps fractional and unreadable pages on whole page buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('pagination');
    for (const [state, current] of [
      ['fractional page', '4'],
      ['unreadable page', '1'],
    ]) {
      const nav = page.getByRole('navigation', { name: `Pages, ${String(state)}` });
      await expect(nav.locator('[aria-current="page"]')).toHaveText(String(current));
      await expect(nav.getByRole('button', { name: /NaN|\d\.\d/ })).toHaveCount(0);
    }
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

  test('UIC-PAGINATION-1.2 shows one page for a single page or none, and the nearest page as the count shrinks', async ({
    page,
    lab,
  }) => {
    await lab.open('pagination');
    for (const state of ['one page', 'no results']) {
      const nav = page.getByRole('navigation', { name: `Pages, ${state}` });
      await expect(nav.locator('.ui-pagination__page')).toHaveText(['1']);
      await expect(nav.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expect(nav.getByRole('button', { name: 'Next page' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    const demo = page.locator('[data-lab-demo="changing-count"]');
    const nav = demo.getByRole('navigation', { name: 'Results pages' });
    const current = nav.locator('[aria-current="page"]');
    await expect(current).toHaveText('10');
    await demo.getByRole('radio', { name: '5' }).click();
    await expect(current).toHaveText('5');
    await expect(demo.locator('[data-lab-output="page"]')).toHaveText('10');
    await expect(demo.locator('[data-lab-output="shown"]')).toHaveText('5');
    await expect(demo.locator('[data-lab-output="calls"]')).toHaveText('none');
    await nav.getByRole('button', { name: 'Previous page' }).click();
    await expect(demo.locator('[data-lab-output="calls"]')).toHaveText('onPageChange(4)');
    await demo.getByRole('radio', { name: '0' }).click();
    await expect(current).toHaveText('1');
    await demo.getByRole('radio', { name: '12' }).click();
    await expect(current).toHaveText('4');
    await lab.expectAccessible();
  });

  test('UIC-PAGINATION-1.1 localizes digits and mirrors the chevrons right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('pagination');
    const nav = page.locator('[data-lab-demo="rtl"] .ui-pagination');
    await expect(nav.locator('[aria-current="page"]')).toHaveText('٦');
    await expect(nav.locator('.ui-pagination__previous .ui-icon__glyph')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    await expect(nav.locator('.ui-pagination__next .ui-icon__glyph')).toHaveAttribute(
      'data-glyph',
      'chevron-left',
    );
  });
});
