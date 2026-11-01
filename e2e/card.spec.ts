import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { expectRowMenuReturnsFocus } from './row-menu.js';

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
        `${cellSelector(`variant=${variant} density=${density} state=${state}`)} .ui-card`,
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

    await demo.getByText('A custom header whose CardAction').click();
    await expect(page).toHaveURL(/#gardens$/);
    await lab.expectAccessible();
  });

  test('UIC-CARD-1.2 UIC-CARD-1.4 keeps the draft and the outline while the title arrives', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="late-title"]');
    const draft = demo.getByRole('textbox', { name: 'Draft' });
    await draft.fill('unsaved');
    const cycle = demo.getByRole('button', { name: /^Title:/ });
    await cycle.click();
    await expect(demo.getByRole('heading', { name: 'Loaded record', level: 3 })).toBeVisible();
    await expect(demo.getByRole('heading', { name: 'Notes', level: 4 })).toBeVisible();
    await cycle.click();
    await expect(demo.getByRole('heading', { name: 'Custom record', level: 3 })).toBeVisible();
    await expect(demo.getByRole('heading', { name: 'Notes', level: 4 })).toBeVisible();
    await cycle.click();
    await expect(draft).toHaveValue('unsaved');
  });

  test('UIC-CARD-3.2 leaves nested cards and editors their own clicks', async ({ page, lab }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="nested-action"]');
    const outer = demo.locator('[data-lab-output="outer"]');
    const inner = demo.locator('[data-lab-output="inner"]');
    await demo.getByText('Ferry to the islands.').click();
    await expect(inner).toHaveText('1');
    await expect(outer).toHaveText('0');
    const editor = demo.locator('[data-lab-editor]');
    await editor.click();
    await page.keyboard.type(' Hat.');
    await expect(editor).toContainText('Hat.');
    await expect(outer).toHaveText('0');
    await demo.getByText('Three days on the coast.').click();
    await expect(outer).toHaveText('1');
    await expect(inner).toHaveText('1');
  });

  test('UIC-CARD-4.1 UIC-CARD-4.2 draws edge-to-edge media and a loading skeleton', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const card = matrixCell(page, 'media=cover content=loading').locator('.ui-card');
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
      matrixCell(page, 'media=none content=loaded').locator('.ui-card__body'),
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

  test('UIC-CARD-5.4 returns focus to a menu button in a card as its menu closes', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="grid"]');
    await expectRowMenuReturnsFocus(
      page,
      demo.getByRole('button', { name: 'More for Tomato soup' }),
      // Tab moves through a card's controls: its selection checkbox, then its menu button.
      async () => {
        await demo.getByRole('row').first().focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
      },
    );
    await expect(demo.locator('[data-lab-output="menu"]')).toHaveText('pin soup');
    await expect(demo.locator('[data-lab-output="opened"]')).toHaveText('none');
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

  test('UIC-CARD-5.3 keeps the selection and focus when the grid switches layout', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="switching"]');
    const row = (name: string) => demo.getByRole('row', { name });
    await row('Green salad').focus();
    await page.keyboard.press('Space');
    await row('Tomato soup').focus();
    await page.keyboard.press('Space');
    for (const mode of ['virtual grid', 'waterfall', 'grid', 'waterfall', 'virtual grid', 'grid']) {
      // The host switching, as on a resize: focus stays where it was.
      await demo.getByRole('button', { name: `Show as ${mode}` }).dispatchEvent('click');
      await expect(demo.getByRole('button', { name: `Show as ${mode}` })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(row('Tomato soup')).toHaveAttribute('data-selected', 'true');
      await expect(row('Green salad')).not.toHaveAttribute('data-selected');
      await expect(row('Tomato soup')).toBeFocused();
    }
    await lab.expectAccessible('[data-lab-demo="switching"]');
  });

  test("UIC-CARD-6.1 UIC-CARD-6.2 collapses a record and keeps its body's state", async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="collapse"]');
    const card = demo.getByRole('region', { name: 'Orchard row 4' });
    const toggle = card.getByRole('button', { name: 'Details Orchard row 4' });
    await card.getByRole('textbox', { name: 'Notes' }).fill('Prune the low branches');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(card.locator('.ui-card__summary')).toBeHidden();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-lab-output="expanded"]')).toHaveText('false');
    await expect(card.locator('.ui-card__body')).toBeHidden();
    await expect(card.locator('.ui-card__footer')).toBeHidden();
    await expect(card.getByRole('progressbar', { name: 'Harvest' })).toBeVisible();
    const header = await card.locator('.ui-card__header').evaluate((node) => ({
      border: getComputedStyle(node).borderBottomWidth,
    }));
    expect(header.border).toBe('0px');
    await toggle.click();
    await expect(card.getByRole('textbox', { name: 'Notes' })).toHaveValue(
      'Prune the low branches',
    );
    await demo.getByRole('button', { name: 'Collapse row 4' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await lab.expectAccessible('[data-lab-demo="collapse"]');
  });

  test('UIC-CARD-7.1 UIC-CARD-7.2 fits cards to a pane from full width down to a few characters', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="pane"]');
    const card = demo.locator('.ui-card').first();
    const thumb = demo.getByRole('slider', { name: 'Pane width' });
    await expect(card).toHaveAttribute('data-presentation', 'full');
    await expect(card.getByRole('button', { name: 'Water' })).toBeVisible();
    const crates = card.getByRole('textbox', { name: 'Crates' });
    await crates.fill('Unsaved');

    await thumb.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await expect(card).toHaveAttribute('data-presentation', 'compact');
    await expect(card.getByRole('button', { name: 'Water' })).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Details Plum row 7' })).toBeVisible();
    const compactMore = card.getByRole('button', { name: 'More Plum row 7' });
    await compactMore.click();
    await expect(crates).toHaveValue('Unsaved');
    await compactMore.click();
    await thumb.focus();

    await page.keyboard.press('Home');
    await expect(card).toHaveAttribute('data-presentation', 'minimal');
    await expect(card.locator('.ui-card__abbreviation')).toHaveText('P7');
    const box = await card.evaluate((node) => ({
      width: node.getBoundingClientRect().width,
      overflows: node.scrollWidth > node.clientWidth + 1,
    }));
    expect(box.width).toBeLessThanOrEqual(56);
    expect(box.overflows).toBe(false);
    await expect(card).toHaveAccessibleName('Plum row 7');
    const more = card.getByRole('button', { name: 'More Plum row 7' });
    await expect(more).toBeVisible();
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(card.getByRole('button', { name: 'Water' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Details Plum row 7' })).toBeVisible();
    await expect(crates).toHaveValue('Unsaved');
    // An Escape the search box takes to clear itself stays there; the next one closes More.
    const find = card.getByRole('textbox', { name: 'Find a tree in Plum row 7' });
    await find.fill('Pear');
    await page.keyboard.press('Escape');
    await expect(find).toHaveValue('');
    await expect(find).toBeFocused();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(more).toBeFocused();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await card.getByRole('button', { name: 'Water' }).focus();
    await page.keyboard.press('Escape');
    await expect(more).toBeFocused();
    await expect(card.getByRole('button', { name: 'Water' })).toHaveCount(0);

    const custom = demo.getByRole('region', { name: 'Plum row 9' });
    await expect(custom).toHaveAttribute('data-presentation', 'minimal');
    await expect(custom.getByRole('button', { name: 'Archive row 9' })).toHaveCount(0);
    await custom.getByRole('button', { name: 'More Plum row 9' }).click();
    await expect(custom.getByRole('button', { name: 'Archive row 9' })).toBeVisible();
    await lab.expectAccessible('[data-lab-demo="pane"]');

    await thumb.focus();
    await page.keyboard.press('End');
    await expect(card).toHaveAttribute('data-presentation', 'full');
    await expect(card.getByRole('button', { name: 'Water' })).toBeVisible();
    await expect(crates).toHaveValue('Unsaved');
    const toggle = card.getByRole('button', { name: 'Details Plum row 7' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(card.getByRole('textbox', { name: 'Notes' })).toBeVisible();
    await lab.expectAccessible('[data-lab-demo="pane"]');
  });

  test('UIC-CARD-6.2 toggles a card in a selectable grid without selecting it', async ({
    page,
    lab,
  }) => {
    await lab.open('card');
    const demo = page.locator('[data-lab-demo="collapse-grid"]');
    const toggle = demo.getByRole('button', { name: 'Details Orchard row 4' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByText('Twelve trees.').first()).toBeVisible();
    await expect(page.locator('[data-lab-output="grid-selected"]')).toHaveText('none');
  });
});
