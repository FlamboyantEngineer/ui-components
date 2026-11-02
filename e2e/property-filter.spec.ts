import type { Locator, Page } from '@playwright/test';
import { expect, familySelector, test, matrixCell } from './fixtures.js';

function panel(page: Page): Locator {
  return matrixCell(page, 'layout=responsive width=wide');
}

function row(scope: Locator, label: string): Locator {
  return scope.locator('.ui-property-row').filter({
    has: scope.page().locator('.ui-property-row__label', { hasText: new RegExp(`^${label}$`) }),
  });
}

test.describe('Property Filter lab', () => {
  test('UIC-PROPERTY-FILTER-1.1 filters rows, hides empty sections and keeps drafts', async ({
    page,
    lab,
  }) => {
    await lab.open('property-filter');
    const frame = panel(page);
    const search = frame.getByRole('searchbox', { name: 'Filter frame responsive wide' });
    const orientation = frame.getByRole('textbox', { name: 'Orientation' });
    await orientation.fill('Landscape');

    await search.fill('paper');
    await expect(row(frame, 'Paper size')).toBeVisible();
    await expect(row(frame, 'Margins')).toBeHidden();
    await expect(frame.getByRole('button', { name: /^Text styles/ })).toBeHidden();
    await expect(frame.locator('mark.ui-text-match').first()).toHaveText(/paper/i);

    await search.fill('font');
    await expect(frame.getByRole('button', { name: /^Heading/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(frame.getByRole('textbox', { name: 'Font size' })).toBeVisible();
    await expect(orientation).toBeHidden();

    await search.fill('');
    await expect(orientation).toBeVisible();
    await expect(orientation).toHaveValue('Landscape');
    await expect(frame.getByRole('button', { name: /^Heading/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('UIC-PROPERTY-FILTER-1.2 clears from the clear button, Escape and the no-match message', async ({
    page,
    lab,
  }) => {
    await lab.open('property-filter');
    const frame = panel(page);
    const search = frame.getByRole('searchbox');
    await search.fill('margins');
    await frame.getByRole('button', { name: 'Clear search' }).click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();

    await search.pressSequentially('size');
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(row(frame, 'Orientation')).toBeVisible();

    await search.fill('zinc');
    const status = frame.getByRole('status');
    await expect(status).toHaveText(/No properties match “zinc”\./);
    await lab.expectAccessible();
    await status.getByRole('button', { name: 'Clear filter' }).click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await expect(status).toBeHidden();
  });

  test('UIC-PROPERTY-FILTER-1.1 passes axe', async ({ page, lab }) => {
    await lab.open('property-filter');
    await lab.expectAccessible();
    await panel(page).getByRole('searchbox').fill('zinc');
    await lab.expectAccessible();
  });

  test('UIC-PROPERTY-FILTER-1.4 follows a host query and matches through its filter', async ({
    page,
    lab,
  }) => {
    await lab.open('property-filter');
    const shared = page.locator('[data-lab-shared]');
    const search = shared.getByRole('searchbox');
    await expect(search).toHaveValue('font');
    await shared.getByRole('button', { name: 'Show paper settings' }).click();
    await expect(search).toHaveValue('paper');
    await expect(shared.getByRole('textbox', { name: 'Paper size' })).toBeVisible();
    await expect(shared.getByRole('textbox', { name: 'Font' })).toBeHidden();
    await search.fill('size');
    await expect(shared.locator('[data-lab-output]')).toHaveText('Query: size');

    const words = page.locator('[data-lab-word-start]');
    await words.getByRole('searchbox').fill('or');
    await expect(words.getByRole('textbox', { name: 'Orientation' })).toBeVisible();
    await expect(words.getByRole('textbox', { name: 'Paper size' })).toBeHidden();
    await lab.expectAccessible('[data-lab-word-start]');
  });

  test('UIC-PROPERTY-FILTER-1.3 passes disabled and read-only to every field', async ({
    page,
    lab,
  }) => {
    await lab.open('property-filter');
    const demo = page.locator('[data-lab-demo="field-state"]');
    const paper = demo.getByRole('textbox', { name: 'Paper size' });
    await expect(paper).toBeEditable();
    await demo.getByRole('radio', { name: 'disabled' }).press('Space');
    await expect(paper).toBeDisabled();
    await demo.getByRole('radio', { name: 'read-only' }).press('Space');
    await expect(paper).toBeEnabled();
    await expect(paper).toHaveAttribute('readonly', '');
    const search = demo.getByRole('searchbox', { name: 'Filter locked settings' });
    await search.fill('font');
    await expect(demo.getByRole('textbox', { name: 'Paper size' })).toBeHidden();
    await expect(demo.getByRole('textbox', { name: 'Font size' })).toHaveAttribute('readonly', '');
  });

  test('UIC-PROPERTY-FILTER-1.4 keeps the host expansion and edits through a query', async ({
    page,
    lab,
  }) => {
    await lab.open('property-filter');
    const demo = page.locator('[data-lab-demo="accordion"]');
    const expanded = demo.locator('[data-lab-output="expanded"]');
    await expect(expanded).toHaveText('page');
    await demo.getByRole('button', { name: 'Text styles' }).click();
    await expect(expanded).toHaveText('text');
    await expect(demo.getByRole('button', { name: 'Page setup' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    const search = demo.getByRole('searchbox', { name: 'Filter accordion settings' });
    await search.fill('paper');
    const paper = demo.getByRole('textbox', { name: 'Paper size' });
    await expect(paper).toBeVisible();
    await expect(expanded).toHaveText('text');
    await paper.fill('Letter');
    await paper.press('Tab');
    await search.fill('');
    await expect(paper).toBeHidden();
    await expect(expanded).toHaveText('text');
    await demo.getByRole('button', { name: 'Page setup' }).click();
    await expect(expanded).toHaveText('page');
    await expect(paper).toHaveValue('Letter');

    const seeded = page.locator('[data-lab-demo="seeded"]');
    const seededSearch = seeded.getByRole('searchbox', { name: 'Filter seeded settings' });
    await expect(seededSearch).toHaveValue('margin');
    await expect(seeded.getByRole('textbox', { name: 'Margins' })).toBeVisible();
    await expect(seeded.getByRole('textbox', { name: 'Font', exact: true })).toBeHidden();
    await seededSearch.fill('');
    await expect(seeded.getByRole('textbox', { name: 'Margins' })).toBeHidden();
    await expect(seeded.getByRole('textbox', { name: 'Font', exact: true })).toBeVisible();
    await expect(seeded.locator('[data-lab-output="expanded"]')).toHaveText('text');
    await lab.expectAccessible(familySelector('property-filter-host-cases'));
  });
});
