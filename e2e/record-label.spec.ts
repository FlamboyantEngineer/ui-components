import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-record-label`;

test.describe('Record Label lab', () => {
  test('UIC-RECORD-LABEL-1.1 UIC-RECORD-LABEL-1.4 keeps the identity on one line at every size', async ({
    page,
    lab,
  }) => {
    await lab.open('record-label');
    for (const [size, pixels] of [
      ['sm', 12],
      ['md', 16],
      ['lg', 20],
    ] as const) {
      const label = page
        .locator('[data-lab-family="record-label-main"]')
        .locator(cell(`content=identifier and name kind=plain size=${size}`));
      await expect(label).toHaveText('REQ-12 Brake pressure limits');
      await expect(label).toHaveAttribute('data-size', size);
      const icon = await label.locator('.ui-record-label__icon').boundingBox();
      expect(icon?.width).toBe(pixels);
    }
    await expect(
      page
        .locator('[data-lab-family="record-label-main"]')
        .locator(cell('content=no icon kind=plain size=md'))
        .locator('.ui-record-label__icon'),
    ).toHaveCount(0);
  });

  test('UIC-RECORD-LABEL-1.2 cuts or wraps the name and never breaks the identity', async ({
    page,
    lab,
  }) => {
    await lab.open('record-label');
    const cut = page
      .locator('[data-lab-family="record-label-main"]')
      .locator(cell('name=truncate kind=plain'));
    const name = cut.locator('.ui-record-label__name');
    expect(await name.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await page.mouse.move(5, 5);
    await name.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Brake pressure limits for wet and icy road surfaces',
    );
    const wrapped = page
      .locator('[data-lab-family="record-label-main"]')
      .locator(cell('name=wrap kind=plain'));
    const identity = await wrapped.locator('.ui-record-label__identity').boundingBox();
    const wrappedName = await wrapped.locator('.ui-record-label__name').boundingBox();
    expect(wrappedName && identity && wrappedName.height > identity.height).toBe(true);
    for (const label of [cut, wrapped]) {
      const box = await label.locator('.ui-record-label__identity').boundingBox();
      expect(box?.height).toBeLessThan(24);
    }
  });

  test('UIC-RECORD-LABEL-1.3 links the whole label and opens the tooltip on keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('record-label');
    const link = page
      .locator('[data-lab-family="record-label-main"]')
      .getByRole('link', { name: 'REQ-12 Brake pressure limits' })
      .first();
    await expect(link).toHaveAttribute('href', '#req-12');
    await expect(link).toHaveClass(/ui-link/);
    const cut = page
      .locator('[data-lab-family="record-label-main"]')
      .locator(cell('name=truncate kind=link'));
    await cut.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(cut).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Brake pressure limits for wet and icy road surfaces',
    );
    const external = page
      .locator('[data-lab-family="record-label-main"]')
      .getByRole('link', { name: 'DOC-3 Field guide (opens in a new tab)' });
    await expect(external).toHaveAttribute('target', '_blank');
  });

  test('UIC-RECORD-LABEL-1.5 shows unavailable records without a link', async ({ page, lab }) => {
    await lab.open('record-label');
    const restricted = page
      .locator('[data-lab-family="record-label-main"]')
      .locator(cell('unavailable=restricted size=md'));
    await expect(restricted).toHaveText('Restricted item');
    await expect(restricted).toHaveAttribute('data-unavailable', 'restricted');
    await expect(restricted.locator('.ui-glyph[data-glyph="lock"]')).toHaveCount(1);
    await expect(
      page
        .locator('[data-lab-family="record-label-main"]')
        .locator(cell('unavailable=missing size=md')),
    ).toHaveText('Missing item');
    await expect(
      page
        .locator('[data-lab-family="record-label-main"]')
        .locator('[data-lab-cell^="unavailable="] a'),
    ).toHaveCount(0);
  });

  test('UIC-RECORD-LABEL-1.3 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('record-label');
    await expect(page.locator('#lab-root .ui-record-label').first()).toBeVisible();
    await lab.expectAccessible();
    await lab.open('record-label', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
