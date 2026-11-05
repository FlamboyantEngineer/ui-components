import { expect, matrixCell, test } from './fixtures.js';

test.describe('Empty State lab', () => {
  test('UIC-EMPTY-STATE-1.2 UIC-EMPTY-STATE-1.3 draws each variant centred or start-aligned', async ({
    page,
    lab,
  }) => {
    await lab.open('empty-state');
    const cells = page.locator('table[data-lab-matrix="variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2 * 3);
    const medium = matrixCell(page, 'variant=error size=md').locator('.ui-empty-state').first();
    const small = matrixCell(page, 'variant=error size=sm').locator('.ui-empty-state').first();
    expect(await medium.evaluate((node) => getComputedStyle(node).textAlign)).toBe('center');
    expect(await small.evaluate((node) => getComputedStyle(node).textAlign)).toBe('start');
    expect(await small.evaluate((node) => getComputedStyle(node).paddingTop)).toBe('4px');
    await expect(medium.getByRole('heading', { level: 3 })).toHaveText('Unable to load cities');
    await expect(
      matrixCell(page, 'variant=loading size=md').locator('.ui-empty-state__description').first(),
    ).toHaveText('Fetching the latest list…');
  });

  test('UIC-EMPTY-STATE-1.1 UIC-EMPTY-STATE-1.4 announces loading politely, then gives way to content', async ({
    page,
    lab,
  }) => {
    await lab.open('empty-state');
    const demo = page.locator('[data-lab-demo="reload"]');
    await expect(demo.getByRole('heading', { name: 'No cities' })).toBeVisible();
    await expect(demo.getByRole('status')).toHaveCount(0);
    await page.locator('[data-lab-action="reload"]').click();
    const status = demo.getByRole('status');
    await expect(status).toHaveText('Loading cities…');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).not.toHaveAttribute('aria-busy');
    const spinner = status.locator('.ui-empty-state__spinner');
    await expect(spinner).toBeVisible();
    expect(await spinner.evaluate((node) => getComputedStyle(node).width)).toBe('14px');
    await page.locator('[data-lab-action="finish"]').click();
    await expect(demo.locator('[data-lab-output="list"] li')).toHaveCount(3);
    await expect(demo.locator('.ui-empty-state')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-EMPTY-STATE-2.1 UIC-EMPTY-STATE-2.2 draws an illustration over the text and actions under it', async ({
    page,
    lab,
  }) => {
    await lab.open('empty-state');
    const table = page.locator('table[data-lab-matrix="variant size"]').nth(2);
    const notice = matrixCell(table, 'variant=empty size=md').locator('.ui-empty-state');
    const icon = await notice.locator('.ui-empty-state__icon').boundingBox();
    const title = await notice.locator('.ui-empty-state__title').boundingBox();
    const actions = await notice.locator('.ui-empty-state__actions').boundingBox();
    const description = await notice.locator('.ui-empty-state__description').boundingBox();
    expect(icon?.width).toBe(32);
    expect((icon?.y ?? 0) + (icon?.height ?? 0)).toBeLessThanOrEqual(title?.y ?? 0);
    expect(actions?.y ?? 0).toBeGreaterThanOrEqual(
      (description?.y ?? 0) + (description?.height ?? 0),
    );
    const add = notice.getByRole('button', { name: 'Add city' });
    const addBox = await add.boundingBox();
    const noticeBox = await notice.boundingBox();
    expect(addBox?.x ?? 0).toBeGreaterThan(noticeBox?.x ?? 0);
    await add.focus();
    await expect(add).toBeFocused();
    const small = matrixCell(table, 'variant=error size=sm').locator('.ui-empty-state');
    expect((await small.locator('.ui-empty-state__icon').boundingBox())?.width).toBe(20);
    const loading = matrixCell(table, 'variant=loading size=md').locator('.ui-empty-state');
    await expect(loading.locator('.ui-empty-state__icon')).toHaveCount(0);
    await expect(loading.locator('.ui-empty-state__spinner')).toHaveCount(1);
    await lab.expectAccessible();
  });

  test('UIC-EMPTY-STATE-1.4 stills the loading spinner under reduced motion, live', async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.open('empty-state');
    const spinner = page.locator('.ui-empty-state__spinner').first();
    await expect(spinner).toBeVisible();
    expect(
      await spinner.evaluate((node: Element) => getComputedStyle(node).animationDuration),
    ).toBe('0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(
      await spinner.evaluate((node: Element) => getComputedStyle(node).animationDuration),
    ).not.toBe('0s');
  });
});
