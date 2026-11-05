import { expect, matrixCell, test } from './fixtures.js';

test.describe('Expression Field lab', () => {
  test('UIC-EXPRESSION-FIELD-1.1 UIC-EXPRESSION-FIELD-2.1 UIC-EXPRESSION-FIELD-2.2 draws every result state', async ({
    page,
    lab,
  }) => {
    await lab.open('expression-field');
    const statuses = ['ready', 'pending', 'invalid', 'unavailable'];
    for (const status of statuses) {
      await expect(
        matrixCell(page, `state=${status}`).locator('.ui-expression-field__result'),
      ).toHaveAttribute('data-status', status);
    }
    await expect(
      matrixCell(page, 'state=empty').locator('.ui-expression-field__result'),
    ).toHaveCount(0);
    const stale = matrixCell(page, 'state=stale');
    await expect(stale.locator('.ui-expression-field__result')).toHaveAttribute(
      'data-stale',
      'true',
    );
    await expect(
      page.getByRole('textbox', { name: 'Expression, stale' }),
    ).toHaveAccessibleDescription('Result 13.5 (Out of date)');
    const box = await page.getByRole('textbox', { name: 'Expression, ready' }).boundingBox();
    expect(box?.height).toBeLessThan(40);
    await expect(page.getByRole('textbox', { name: 'Expression, disabled' })).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-EXPRESSION-FIELD-1.3 UIC-EXPRESSION-FIELD-2.2 evaluates with a mock host without touching the draft', async ({
    page,
    lab,
  }) => {
    await lab.open('expression-field');
    const demo = page.locator('[data-lab-demo="live"]');
    const input = demo.getByRole('textbox', { name: 'Area' });
    const result = demo.locator('.ui-expression-field__result');
    await expect(result).toHaveAttribute('data-status', 'ready');
    await expect(result.locator('.ui-expression-field__result-value')).toHaveText('38.5');
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' * 2');
    await expect(result).toHaveAttribute('data-stale', 'true');
    await expect(result.locator('.ui-expression-field__result-value')).toHaveText('39.5');
    await expect(result).not.toHaveAttribute('data-stale');
    await expect(input).toHaveValue('width * height + 1 * 2');
    await expect(input).toBeFocused();
    await page.keyboard.type(' *');
    await expect(result).toHaveAttribute('data-status', 'invalid');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('width * height + 1');
    await page.keyboard.type('0');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="Commits"]')).toHaveText('["width * height + 10"]');
  });

  test('UIC-EXPRESSION-FIELD-1.2 keeps exact decimals as typed', async ({ page, lab }) => {
    await lab.open('expression-field');
    const demo = page.locator('[data-lab-demo="exact"]');
    const exact = demo.getByRole('textbox', { name: 'Exact decimal' });
    await expect(exact).toHaveValue('9007199254740993.0000000000000001');
    await exact.fill('1.00000000000000000000000000000000001');
    await exact.press('Enter');
    await expect(demo.locator('[data-lab-output="Exact commits"]')).toHaveText(
      '["1.00000000000000000000000000000000001"]',
    );
    const tolerance = demo.getByRole('textbox', { name: 'Tolerance' });
    await expect(tolerance).toHaveValue('1e-100');
  });
});
