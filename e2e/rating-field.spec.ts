import { expect, matrixCell, test } from './fixtures.js';

test.describe('Rating Field lab', () => {
  test('UIC-RATING-FIELD-1.1 UIC-RATING-FIELD-1.5 draws outlined and filled glyphs in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('rating-field');
    const rated = matrixCell(page, 'state=rated size=md');
    await expect(rated.getByRole('radio', { name: '3 out of 5' })).toBeChecked();
    const items = rated.locator('.ui-rating-field__item');
    await expect(items).toHaveCount(5);
    const fillOf = (index: number) =>
      items
        .nth(index)
        .locator('.ui-rating-field__fill')
        .evaluate((node) => getComputedStyle(node).visibility);
    expect(await fillOf(2)).toBe('visible');
    expect(await fillOf(3)).toBe('hidden');
    // The filled glyph is painted, the outline is not: they differ by shape as well as colour.
    const paint = await items
      .nth(0)
      .locator('.ui-rating-field__fill')
      .evaluate((node) => getComputedStyle(node).fill);
    expect(paint).not.toBe('none');
    for (const [size, edge] of [
      ['xs', 16],
      ['md', 24],
      ['lg', 28],
    ] as const) {
      const box = await matrixCell(page, `state=rated size=${size}`)
        .locator('.ui-rating-field__item')
        .first()
        .boundingBox();
      expect(box?.width).toBe(edge);
    }
    await lab.expectAccessible();
  });

  test('UIC-RATING-FIELD-1.2 UIC-RATING-FIELD-2.1 UIC-RATING-FIELD-2.2 previews on hover and steps by halves', async ({
    page,
    lab,
  }) => {
    await lab.open('rating-field');
    const demo = page.locator('[data-lab-demo="half"]');
    const items = demo.locator('.ui-rating-field__item');
    const value = demo.locator('[data-lab-output="value"]');
    await expect(items.nth(3)).toHaveAttribute('data-fill', 'partial');
    await demo.scrollIntoViewIfNeeded();
    const fifth = await items.nth(4).boundingBox();
    if (!fifth) throw new Error('Missing glyph geometry');
    await page.mouse.move(fifth.x + fifth.width * 0.75, fifth.y + fifth.height / 2);
    await expect(items.nth(4)).toHaveAttribute('data-fill', 'full');
    await expect(demo.locator('.ui-rating-field__group')).toHaveAttribute(
      'data-previewing',
      'true',
    );
    await expect(value).toHaveText('3.5');
    await page.mouse.move(fifth.x + fifth.width * 0.25, fifth.y + fifth.height / 2);
    await expect(items.nth(4)).toHaveAttribute('data-fill', 'partial');
    await page.mouse.click(fifth.x + fifth.width * 0.25, fifth.y + fifth.height / 2);
    await expect(value).toHaveText('4.5');
    await page.mouse.move(0, 0);
    await expect(demo.locator('.ui-rating-field__group')).not.toHaveAttribute('data-previewing');
    await expect(items.nth(4)).toHaveAttribute('data-fill', 'partial');
    await page.keyboard.press('ArrowLeft');
    await expect(value).toHaveText('4');
    await expect(demo.getByRole('radio', { name: '4 out of 5' })).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-RATING-FIELD-2.2 fills from the right and follows the reading right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('rating-field');
    const demo = page.locator('[data-lab-demo="rtl"]');
    const items = demo.locator('.ui-rating-field__item');
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    if (!first || !second) throw new Error('Missing glyph geometry');
    expect(first.x).toBeGreaterThan(second.x);
    await demo.getByRole('radio', { name: '2.5 out of 5' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(demo.getByRole('radio', { name: '3 out of 5' })).toBeChecked();
  });

  test('UIC-RATING-FIELD-3.1 submits the rating and resets to the default', async ({
    page,
    lab,
  }) => {
    await lab.open('rating-field');
    const form = page.locator('[data-lab-form="Review"]');
    await form.locator('label', { has: page.getByRole('radio', { name: '2 out of 5' }) }).click();
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(form.locator('[data-lab-output="Review submitted"]')).toHaveText('service=2');
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(form.getByRole('radio', { name: '4 out of 5' })).toBeChecked();
  });

  test('UIC-RATING-FIELD-4.1 UIC-RATING-FIELD-4.2 names a fractional aggregate once', async ({
    page,
    lab,
  }) => {
    await lab.open('rating-field');
    const rating = matrixCell(page, 'score=4.3 size=md').getByRole('img', { name: '4.3 out of 5' });
    const last = rating.locator('.ui-rating__item').nth(4);
    await expect(last).toHaveAttribute('data-fill', 'partial');
    const clip = await last
      .locator('.ui-rating__fill')
      .evaluate((node) => getComputedStyle(node).clipPath);
    expect(clip).toContain('70%');
    await expect(matrixCell(page, 'score=none size=md').getByRole('img')).toHaveAccessibleName(
      'No rating',
    );
    await expect(
      page.locator('[data-lab-demo="reviews"]').getByRole('img', {
        name: '4.3 out of 5, 128 reviews',
      }),
    ).toBeVisible();
  });
});
