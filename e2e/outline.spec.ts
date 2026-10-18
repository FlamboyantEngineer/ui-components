import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const cell = (page: Page, id: string) => page.locator(`[data-lab-cell="${id}"] .ui-outline`);

test.describe('Outline lab', () => {
  test('UIC-OUTLINE-1.1 UIC-OUTLINE-1.3 UIC-OUTLINE-1.4 UIC-OUTLINE-2.1 renders every state', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const plain = cell(page, 'numbering=plain state=current');
    await expect(plain).toHaveRole('navigation');
    await expect(plain.getByRole('link')).toHaveText([
      'Apples',
      'Sweet apples',
      'Tart apples',
      'Pears',
      'Autumn pears',
    ]);
    await expect(plain.getByRole('link', { name: 'Tart apples' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    const numbered = cell(page, 'numbering=numbered state=current');
    await expect(numbered.getByRole('link', { name: '1.2 Tart apples' })).toBeVisible();
    await expect(numbered.getByRole('link', { name: '2.1 Autumn pears' })).toBeVisible();

    const collapsed = cell(page, 'numbering=plain state=collapsed below 2');
    await expect(collapsed.getByRole('link')).toHaveText(['Apples', 'Pears']);
    await expect(collapsed.locator('.ui-outline__item').first()).toHaveAttribute(
      'data-current-within',
      'true',
    );
    await expect(cell(page, 'numbering=plain state=loading').getByRole('status')).toHaveText(
      'Loading',
    );
    await expect(cell(page, 'numbering=plain state=empty')).toHaveText('No headings yet.');
  });

  test('UIC-OUTLINE-2.2 UIC-OUTLINE-3.1 follows the scroll and jumps to headings', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const demo = page.locator('[data-lab-demo="reader"]');
    const outline = demo.getByRole('navigation', { name: 'Guide' });
    const current = outline.locator('[aria-current="location"]');
    await expect(current).toHaveText('1 Welcome');

    await outline.getByRole('link', { name: '3.3.1 Viewpoints' }).click();
    await expect(page.locator('#guide-viewpoints')).toBeFocused();
    await expect(demo.locator('[data-lab-followed]')).toHaveText('guide-viewpoints');
    await expect(current).toHaveText('3.3.1 Viewpoints');
    expect(page.url()).not.toContain('#guide-viewpoints');

    const viewport = demo.getByRole('region', { name: 'Guide text' });
    await viewport.evaluate((element) => element.scrollTo({ top: 0 }));
    await expect(current).toHaveText('1 Welcome');

    await outline.getByRole('link', { name: '2.2 By air' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#guide-air')).toBeFocused();
    await expect(current).toHaveText('2.2 By air');
    const offset = await page
      .locator('#guide-air')
      .evaluate(
        (heading) =>
          heading.getBoundingClientRect().top -
          (heading.closest('[role="region"]') as HTMLElement).getBoundingClientRect().top,
      );
    expect(Math.round(offset)).toBe(40);
  });

  test('UIC-OUTLINE-4.1 UIC-OUTLINE-4.2 UIC-OUTLINE-5.1 collapses sections from the keyboard and the caller', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const demo = page.locator('[data-lab-demo="controlled"]');
    const outline = demo.getByRole('navigation', { name: 'Guide sections' });
    const districts = outline.getByRole('button', { name: 'Sections in Districts' });
    await expect(districts).toHaveAttribute('aria-expanded', 'true');
    await expect(outline.getByRole('link', { name: 'III.c Hills' })).toBeVisible();
    await expect(outline.getByRole('link', { name: 'III.c.1 Viewpoints' })).toBeHidden();

    await districts.focus();
    await page.keyboard.press('Tab');
    await expect(outline.getByRole('link', { name: 'III Districts' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(outline.getByRole('link', { name: 'III.a Old town' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(districts).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(districts).toHaveAttribute('aria-expanded', 'false');
    await expect(outline.getByRole('link', { name: 'III.a Old town' })).toBeHidden();
    await expect(demo.locator('[data-lab-expanded]')).toHaveText('none');
    await expect(outline.locator('.ui-outline__item[data-current-within]').first()).toContainText(
      'Districts',
    );

    await demo.getByRole('button', { name: 'Expand all' }).click();
    await expect(outline.getByRole('link', { name: 'III.c.1 Viewpoints' })).toBeVisible();
    await expect(outline.locator('[aria-current="location"]')).toHaveText('III.c.1 Viewpoints');
    await outline.getByRole('button', { name: 'Sections in Food' }).press('Space');
    await expect(demo.locator('[data-lab-expanded]')).toHaveText(
      'guide-arriving, guide-districts, guide-hills',
    );
    await demo.getByRole('button', { name: 'Collapse all' }).click();
    await expect(outline.getByRole('link')).toHaveText([
      'I Welcome',
      'II Arriving',
      'III Districts',
      'IV Food',
      'V Practical notes',
    ]);
  });

  test('UIC-OUTLINE-5.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('outline');
    await expect(page.locator('#lab-root .ui-outline').first()).toBeVisible();
    await lab.expectAccessible();
    await lab.open('outline', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
