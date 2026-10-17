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

  test('UIC-CARD-1.4 names a card by the slotted title of its custom header', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const region = page.getByRole('region', { name: 'Seed swap', exact: true });
    await expect(region).toBeVisible();
    const slotted = region.getByRole('heading', { name: 'Seed swap' });
    await expect(slotted).toHaveClass(/ui-card__title/);
    await expect(region).toHaveAttribute(
      'aria-labelledby',
      (await slotted.getAttribute('id')) ?? '',
    );
    const own = page
      .getByRole('region', { name: 'Notifications (title)', exact: true })
      .locator('.ui-card__title');
    const font = (locator: typeof own) =>
      locator.evaluate(
        (node) => `${getComputedStyle(node).fontSize} ${getComputedStyle(node).fontWeight}`,
      );
    expect(await font(slotted)).toBe(await font(own));
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

  test('UIC-CARD-3.1 UIC-CARD-3.2 activates the whole-card action from anywhere but inner controls', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="action"]');
    const harbour = demo.getByRole('region', { name: 'Harbour walk' });
    await expect(harbour.getByRole('link', { name: 'Harbour walk' })).toHaveClass(
      /ui-card__action/,
    );
    await harbour.getByRole('button', { name: 'Share' }).click();
    await expect(demo.locator('[data-lab-output="shared"]')).toHaveText('1');
    expect(new URL(page.url()).hash).toBe('');
    await harbour.getByText('Start at the old pier').click();
    await expect(page).toHaveURL(/#harbour$/);

    const market = demo.getByRole('region', { name: 'Market tour' });
    await market.getByText('Fresh bread').click();
    await expect(demo.locator('[data-lab-output="opened"]')).toHaveText('1');
    await market.getByRole('button', { name: 'Market tour' }).focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="opened"]')).toHaveText('2');
    expect(await market.evaluate((node) => getComputedStyle(node).cursor)).toBe('pointer');

    await demo.getByText('A custom header whose slotted link').click();
    await expect(page).toHaveURL(/#gardens$/);
    await lab.expectAccessible();
  });

  test('UIC-CARD-4.1 UIC-CARD-4.2 draws edge-to-edge media and a loading skeleton', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const card = page.locator('[data-lab-cell="media=cover content=loading"] .ui-card');
    await expect(card).toHaveAttribute('aria-busy', 'true');
    const cardBox = await card.boundingBox();
    const mediaBox = await card.locator('.ui-card__media').boundingBox();
    const headerBox = await card.locator('.ui-card__header').boundingBox();
    expect(mediaBox?.width).toBe((cardBox?.width ?? 0) - 2);
    expect(mediaBox?.y).toBe((cardBox?.y ?? 0) + 1);
    expect(headerBox?.y ?? 0).toBeGreaterThanOrEqual((mediaBox?.y ?? 0) + (mediaBox?.height ?? 0));
    const skeleton = card.locator('.ui-card__skeleton');
    expect((await skeleton.boundingBox())?.height).toBe(52);
    await expect(card.locator('.ui-card__body')).not.toContainText('Open on weekends');
    await expect(
      page.locator('[data-lab-cell="media=none content=loaded"] .ui-card__body'),
    ).toHaveText('Open on weekends from April to October.');
    await lab.expectAccessible();
  });

  test('UIC-CARD-5.1 UIC-CARD-5.3 navigates, selects and opens cards in a grid by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="grid"]');
    const grid = demo.getByRole('grid', { name: 'Recipes' });
    const rows = grid.getByRole('row');
    await expect(rows).toHaveCount(6);
    const first = await rows.nth(0).boundingBox();
    const fourth = await rows.nth(3).boundingBox();
    expect(fourth?.x).toBe(first?.x);
    expect(fourth?.y ?? 0).toBeGreaterThan(first?.y ?? 0);
    await expect(rows.nth(1)).toHaveAttribute('data-selected', 'true');
    await expect(rows.nth(1).locator('.ui-card')).toHaveAttribute('data-selected', 'true');

    await rows.nth(1).locator('.ui-card-grid-item__checkbox').click();
    await expect(demo.locator('[data-lab-output="selected"]')).toHaveText('none');
    await rows.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(4)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="opened"]')).toHaveText('curry');
    await page.keyboard.press('Space');
    await expect(demo.locator('[data-lab-output="selected"]')).toHaveText('curry');
    await rows.nth(5).locator('.ui-card-grid-item__checkbox').click();
    await expect(demo.locator('[data-lab-output="selected"]')).toHaveText('curry, tart');
    await expect(rows.nth(5).locator('.ui-card')).toHaveAttribute('data-selected', 'true');
    await lab.expectAccessible();
  });

  test('UIC-CARD-5.2 lays cards out as a virtualized waterfall', async ({ page, lab }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="waterfall"]');
    const rows = demo.getByRole('row');
    await expect(rows.first()).toBeVisible();
    await demo.scrollIntoViewIfNeeded();
    await rows.first().focus();
    const boxes = await rows.evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y), height: Math.round(box.height) };
      }),
    );
    const columns = [...new Set(boxes.map((box) => box.x))];
    expect(columns.length).toBeGreaterThanOrEqual(3);
    expect(new Set(boxes.map((box) => box.height)).size).toBeGreaterThan(1);
    const lefts = boxes.filter((box) => box.x === columns[0]);
    expect(lefts.length).toBeGreaterThan(1);
    // WaterfallLayout moves left and right by position, up and down in collection order.
    await page.keyboard.press('ArrowRight');
    const focused = await page.evaluate(() => {
      const box = document.activeElement?.getBoundingClientRect();
      return { x: Math.round(box?.x ?? 0), y: Math.round(box?.y ?? 0) };
    });
    expect(focused.x).toBe(columns.toSorted((a, b) => a - b)[1]);
    expect(focused.y).toBe(boxes[0]?.y);
    await lab.expectAccessible('[data-lab-demo="waterfall"]');
  });
});
