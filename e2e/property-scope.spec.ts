import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function cell(page: Page, query: string, clear = 'without'): Locator {
  return matrixCell(page, `query=${query} clear=${clear}`);
}

function row(scope: Locator, label: string): Locator {
  return scope.locator('.ui-property-row').filter({
    has: scope.page().locator('.ui-property-row__label', { hasText: new RegExp(`^${label}$`) }),
  });
}

test.describe('Property Scope lab', () => {
  test('UIC-PROPERTY-SCOPE-1.1 UIC-PROPERTY-SCOPE-1.2 keeps matching rows and opens the containers that hold them', async ({
    page,
    lab,
  }) => {
    await lab.open('property-scope');
    const none = cell(page, 'none');
    await expect(none.getByRole('button', { name: /^Sizes/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    const label = cell(page, 'label');
    await expect(label.getByRole('button', { name: /^Sizes/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(row(label, 'Height')).toBeVisible();
    await expect(row(label, 'Width')).toBeHidden();
    await expect(label.getByRole('button', { name: /^Colours/ })).toBeHidden();
    await expect(label.getByRole('button', { name: /^Shadow/ })).toBeHidden();

    const title = cell(page, 'title');
    await expect(row(title, 'Fill')).toBeVisible();
    await expect(row(title, 'Stroke')).toBeVisible();
    await expect(title.getByRole('button', { name: /^Sizes/ })).toBeHidden();

    const card = cell(page, 'card');
    await expect(card.getByRole('button', { name: /^Shadow/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(row(card, 'Blur')).toBeVisible();
    await expect(card.getByRole('group', { name: 'Box' })).toBeHidden();
  });

  test('UIC-PROPERTY-SCOPE-1.3 marks matched text in place', async ({ page, lab }) => {
    await lab.open('property-scope');
    const mark = cell(page, 'title').locator('.ui-property-section__title mark.ui-text-match');
    await expect(mark).toHaveText('Colour');
    await expect(cell(page, 'title').getByRole('button', { name: /^Colours/ })).toBeVisible();
    const background = await mark.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('UIC-PROPERTY-SCOPE-1.4 reports no match and lets the host clear its query', async ({
    page,
    lab,
  }) => {
    await lab.open('property-scope');
    await expect(cell(page, 'no match').getByRole('status')).toHaveText(
      'No properties match “zinc”.',
    );
    await expect(
      cell(page, 'no match', 'with').getByRole('button', { name: 'Clear filter' }),
    ).toBeVisible();
    await expect(cell(page, 'none').getByRole('status')).toBeHidden();

    const host = page.locator('[data-lab-host-search]');
    const search = host.getByRole('searchbox', { name: 'Find a setting' });
    await search.fill('zinc');
    await host.getByRole('button', { name: 'Clear filter' }).click();
    await expect(search).toHaveValue('');
    await expect(row(host, 'Fill')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-PROPERTY-SCOPE-1.4 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('property-scope', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-PROPERTY-SCOPE-1.6 matches through the host’s filter', async ({ page, lab }) => {
    await lab.open('property-scope');
    const area = page.locator('[data-lab-whole-words]');
    const search = area.getByRole('searchbox', { name: 'Find a whole word' });
    await expect(area.locator('.ui-property-scope__status')).toContainText('No properties match');
    await search.fill('width');
    await expect(row(area, 'Width')).toBeVisible();
    await expect(row(area, 'Height')).toBeHidden();
    await lab.expectAccessible('[data-lab-whole-words]');
  });
});
