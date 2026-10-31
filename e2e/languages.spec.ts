import { expect, test, matrixCell } from './fixtures.js';

test.describe('Languages lab', () => {
  test('UIC-PROVIDER-3.3 UIC-PROVIDER-3.5 switches every component to the chosen language without a reload', async ({
    page,
    lab,
  }) => {
    await lab.open('languages');
    const demo = page.locator('[data-lab-demo="switching"]');
    const output = demo.locator('[data-lab-output="page"]');
    await expect(output).toHaveAttribute('lang', 'en-US');
    await expect(output.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(output.locator('.ui-load-more')).toHaveText('Load more (1200 remaining)');
    await expect(output.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(demo.locator('[data-lab-output="host"]')).toHaveText(
      '3 guests at the table: Ana, Ben, and Chloé',
    );

    await demo.locator('[data-lab-field="language"]').getByRole('button').first().click();
    await page.getByRole('option', { name: 'Français' }).click();
    await expect(output).toHaveAttribute('lang', 'fr-FR');
    await expect(output.locator('.ui-load-more')).toHaveText(/^Charger plus \(1\s200 restants\)$/);
    await expect(output.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    await expect(output.getByRole('group', { name: 'Réactions' })).toBeVisible();
    await expect(demo.locator('[data-lab-output="host"]')).toHaveText(
      /^3 invités à table\s: Ana, Ben et Chloé$/,
    );

    await demo.locator('[data-lab-field="language"]').getByRole('button').first().click();
    await page.getByRole('option', { name: '日本語' }).click();
    await expect(output).toHaveAttribute('lang', 'ja-JP');
    await expect(output.getByRole('navigation', { name: 'ページ送り' })).toBeVisible();
    await expect(output.getByRole('button', { name: '再試行' })).toBeVisible();
    await expect(demo.locator('[data-lab-output="host"]')).toHaveText(
      'テーブルのゲスト 3 人: Ana、Ben、Chloé',
    );
    await lab.expectAccessible();
  });

  test('UIC-PROVIDER-3.4 counts and lists follow each language', async ({ page, lab }) => {
    await lab.open('languages');
    const cell = (count: string, language: string) =>
      matrixCell(page, `count=${count} language=${language}`);
    await expect(cell('1', 'en')).toHaveText('1 item · You chose Ana');
    await expect(cell('2', 'es')).toHaveText('2 elementos · Elegiste Ana y Ben');
    await expect(cell('1200', 'fr')).toHaveText(
      /^1\s200 éléments · Vous avez choisi Ana, Ben et Chloé$/,
    );
    await expect(cell('3', 'ja')).toHaveText('3 件 · Ana、Ben、Chloéを選択しました');
  });
});

test.describe('Languages lab in a French browser', () => {
  test.use({ locale: 'fr-FR' });

  test('UIC-PROVIDER-3.4 UIC-PROVIDER-4.1 formats text without a locale in the browser locale', async ({
    page,
    lab,
  }) => {
    await lab.open('languages');
    await expect(page.locator('[data-lab-output="browser-locale"]')).toHaveText(
      /^1\s200 éléments · Vous avez choisi Ana, Ben et Chloé$/,
    );
  });
});
