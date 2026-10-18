import { expect, test } from './fixtures.js';

test.describe('Mapping Table lab', () => {
  test('UIC-MAPPING-TABLE-1.1 UIC-MAPPING-TABLE-1.3 UIC-MAPPING-TABLE-2.1 UIC-MAPPING-TABLE-2.2 draws suggestions, problems and summaries', async ({
    page,
    lab,
  }) => {
    await lab.open('mapping-table');
    const cells = page.locator('table[data-lab-matrix="state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4);
    const suggested = page.getByRole('group', { name: 'Mapping, suggested' });
    await expect(suggested.getByRole('row')).toHaveCount(6);
    await expect(suggested.locator('.ui-mapping-table__row[data-suggested]')).toHaveCount(4);
    await expect(suggested.getByRole('button', { name: /Import Notes as/ })).toContainText(
      'Don’t import',
    );
    await expect(suggested.locator('.ui-mapping-table__counts')).toHaveText(
      '4 of 5 columns mapped · 1 not imported',
    );
    const incomplete = page.getByRole('group', { name: 'Mapping, incomplete' });
    await expect(incomplete).not.toHaveAttribute('data-complete');
    await expect(incomplete.locator('.ui-mapping-table__problem')).toHaveText(
      'Required fields not mapped: Email.',
    );
    const duplicate = page.getByRole('group', { name: 'Mapping, duplicate' });
    await expect(duplicate.locator('.ui-mapping-table__row[data-duplicate]')).toHaveCount(2);
    await expect(duplicate.getByText('Email is also mapped from Notes.')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-MAPPING-TABLE-1.2 UIC-MAPPING-TABLE-2.3 maps a column and reports the mapping', async ({
    page,
    lab,
  }) => {
    await lab.open('mapping-table');
    const demo = page.locator('[data-lab-demo="live"]');
    const value = demo.locator('[data-lab-value]');
    const importButton = demo.getByRole('button', { name: 'Import contacts' });
    await expect(importButton).toBeEnabled();

    await demo.getByRole('button', { name: /Import E-mail as/ }).click();
    await page.getByRole('option', { name: 'Don’t import' }).click();
    await expect(value).toContainText('"e-mail": null');
    await expect(demo.locator('.ui-mapping-table__problem')).toHaveText(
      'Required fields not mapped: Email.',
    );
    await expect(importButton).toBeDisabled();

    await demo.getByRole('button', { name: /Import Notes as/ }).click();
    await page.getByRole('option', { name: /Email/ }).click();
    await expect(value).toContainText('"notes": "email"');
    await expect(demo.locator('.ui-mapping-table__problem')).toHaveCount(0);
    await expect(demo.locator('.ui-mapping-table__row[data-key="notes"]')).not.toHaveAttribute(
      'data-suggested',
    );
    await expect(demo.locator('.ui-mapping-table__counts')).toHaveText(
      '4 of 5 columns mapped · 1 not imported',
    );
    await expect(importButton).toBeEnabled();
    await lab.expectAccessible();
  });
});
