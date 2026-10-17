import { expect, test } from './fixtures.js';

test.describe('Card lab', () => {
  test('UIC-CARD-2.1 UIC-CARD-2.2 draws every variant, density and state', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const cells = page.locator('table[data-lab-matrix="variant density state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 4 * 4);
    const card = (variant: string, density: string, state = 'resting') =>
      page.locator(
        `[data-lab-cell="variant=${variant} density=${density} state=${state}"] .ui-card`,
      );
    const padding = (density: string) =>
      card('default', density).evaluate((node) => getComputedStyle(node).padding);
    expect(await padding('default')).toBe('0px');
    expect(await padding('comfortable')).toBe('10px');
    expect(await padding('compact')).toBe('8px');
    expect(await padding('tight')).toBe('4px 6px');
    expect(
      await card('default', 'default')
        .locator('.ui-card__header')
        .evaluate((node) => getComputedStyle(node).paddingTop),
    ).toBe('12px');
    expect(
      await card('default', 'tight')
        .locator('.ui-card__header')
        .evaluate((node) => getComputedStyle(node).paddingTop),
    ).toBe('0px');
    const surface = (variant: string) =>
      card(variant, 'default').evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(await surface('panel')).not.toBe(await surface('default'));
  });

  test('UIC-CARD-1.1 UIC-CARD-1.2 UIC-CARD-1.3 names titled cards as regions with header parts', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const region = page.getByRole('region', { name: 'Notifications (actions)', exact: true });
    await expect(region).toBeVisible();
    await expect(region.getByRole('heading', { level: 3 })).toHaveText('Notifications (actions)');
    await expect(region.locator('.ui-card__description')).toHaveText(
      'Choose what reaches your inbox.',
    );
    const heading = await region.locator('.ui-card__heading').boundingBox();
    const actions = await region.locator('.ui-card__actions').boundingBox();
    expect(actions?.y ?? 0).toBeGreaterThanOrEqual(heading?.y ?? 0);
    await expect(page.getByRole('region', { name: 'Card without header' })).not.toContainText(
      'Notifications',
    );
    await expect(
      page.getByRole('region', { name: 'Card without header' }).locator('header'),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-CARD-2.3 draws the selection edge on the chosen card', async ({ page, lab }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="select"]');
    const oslo = demo.getByRole('region', { name: 'Oslo' });
    const lisbon = demo.getByRole('region', { name: 'Lisbon' });
    await expect(lisbon).toHaveAttribute('data-selected', 'true');
    await oslo.getByRole('button', { name: 'Choose Oslo' }).click();
    await expect(oslo).toHaveAttribute('data-selected', 'true');
    await expect(lisbon).not.toHaveAttribute('data-selected');
    await expect(oslo.getByRole('button', { name: 'Choose Oslo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await oslo.evaluate((node) => getComputedStyle(node).borderTopColor)).toBe(
      'rgb(9, 105, 218)',
    );
  });

  test('UIC-CARD-1.1 lets a filled body grow to the card height', async ({ page, lab }) => {
    await lab.open('card');
    const card = page.locator('[data-lab-fill-frame] .ui-card');
    const cardBox = await card.boundingBox();
    const headerBox = await card.locator('.ui-card__header').boundingBox();
    const bodyBox = await card.locator('.ui-card__body').boundingBox();
    expect(cardBox?.height).toBe(160);
    expect(Math.round((bodyBox?.y ?? 0) + (bodyBox?.height ?? 0))).toBe(
      Math.round((cardBox?.y ?? 0) + (cardBox?.height ?? 0) - 1),
    );
    expect(bodyBox?.y ?? 0).toBeGreaterThanOrEqual((headerBox?.y ?? 0) + (headerBox?.height ?? 0));
  });
});
