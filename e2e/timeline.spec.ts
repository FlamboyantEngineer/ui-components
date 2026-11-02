import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

test.describe('Timeline lab', () => {
  test('UIC-TIMELINE-1.12 UIC-TIMELINE-2.6 shows, edits and keeps assignees and links task cards', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const demo = page.locator('[data-lab-demo="task-menus"]');
    const timeline = demo.getByRole('group', { name: 'Garden plan' });
    const sow = timeline.getByRole('button', { name: 'Sow seeds' });
    await sow.scrollIntoViewIfNeeded();
    await expect(sow).toHaveAccessibleDescription(/Assigned to Ana Lima and Leo Park/);
    const avatars = sow.locator('.ui-timeline__assignees');
    const [bar, group] = await Promise.all([sow.boundingBox(), avatars.boundingBox()]);
    expect((group?.x ?? 0) + (group?.width ?? 0)).toBeLessThanOrEqual(
      (bar?.x ?? 0) + (bar?.width ?? 0),
    );
    await expect(
      timeline.getByRole('button', { name: 'Lay gravel' }).locator('.ui-timeline__assignees'),
    ).toHaveCount(0);
    // The menu links the task card.
    await sow.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Open task card' })).toHaveAttribute(
      'href',
      '#tasks/sow',
    );
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Sow seeds' });
    await expect(dialog.getByRole('link', { name: 'Open Sow seeds' })).toHaveAttribute(
      'href',
      '#tasks/sow',
    );
    // Reassign: Ana off, Sam on.
    await dialog.getByRole('button', { name: /Remove Ana Lima/ }).click();
    const picker = dialog.getByRole('combobox', { name: 'Assignees' });
    await picker.fill('Sam');
    await page.getByRole('option', { name: /Sam Ortiz/ }).click();
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(sow).toHaveAccessibleDescription(/Assigned to Leo Park and Sam Ortiz/);
    // A move keeps them.
    await sow.focus();
    await page.keyboard.press('ArrowRight');
    await expect(sow).toHaveAccessibleDescription(/Mar 13, 2026 to Mar 17, 2026/);
    await expect(sow).toHaveAccessibleDescription(/Assigned to Leo Park and Sam Ortiz/);
    // The table names them, links the task card and marks the unassigned item.
    await demo.getByRole('radio', { name: 'Table' }).click();
    await expect(demo.getByRole('link', { name: 'Sow seeds' })).toHaveAttribute(
      'href',
      '#tasks/sow',
    );
    await expect(demo.getByRole('row', { name: /Lay gravel/ })).toContainText('Unassigned');
    await lab.expectAccessible('[data-lab-demo="task-menus"]');
  });

  test('UIC-TIMELINE-2.5 UIC-TIMELINE-2.6 edits an item from its context menu in a modal editor', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const demo = page.locator('[data-lab-demo="task-menus"]');
    const timeline = demo.getByRole('group', { name: 'Garden plan' });
    const log = demo.locator('[data-lab-log="task-menus"]');
    const dig = timeline.getByRole('button', { name: 'Dig beds' });
    await dig.scrollIntoViewIfNeeded();
    // A secondary click opens the menu without selecting or moving the item.
    const box = await dig.boundingBox();
    await dig.click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'Dig beds actions' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Open task card',
      'Edit',
      'Mark complete',
      'Remove',
    ]);
    await lab.expectAccessible('.ui-menu-popover');
    await menu.getByRole('menuitem', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Dig beds' });
    await expect(dialog).toBeVisible();
    await lab.expectAccessible('.ui-timeline-item-editor');
    const name = dialog.getByRole('textbox', { name: 'Name' });
    await expect(name).toBeFocused();
    await name.fill('');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeVisible();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await name.fill('Dig raised beds');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(log).toHaveText('Last action: saved Dig raised beds');
    const raised = timeline.getByRole('button', { name: 'Dig raised beds' });
    await expect(raised).toBeFocused();
    expect(await raised.boundingBox()).toEqual(box);
    // From the keyboard; Escape leaves the item as it was.
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const again = page.getByRole('dialog', { name: 'Edit Dig raised beds' });
    await again.getByRole('textbox', { name: 'Name' }).fill('Discarded');
    // The first Escape gives the field its value back, the second closes the editor.
    await page.keyboard.press('Escape');
    await expect(again.getByRole('textbox', { name: 'Name' })).toHaveValue('Dig raised beds');
    await page.keyboard.press('Escape');
    await expect(again).toBeHidden();
    await expect(raised).toBeFocused();
    await expect(timeline.getByRole('button', { name: 'Discarded' })).toHaveCount(0);
    // A read-only item only shows its details.
    await timeline.getByRole('button', { name: 'Lay gravel' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'View details' }).click();
    const details = page.getByRole('dialog', { name: 'Lay gravel' });
    await expect(details.getByRole('textbox', { name: 'Name' })).toHaveAttribute('readonly', '');
    await expect(details.getByRole('button', { name: 'Save' })).toHaveCount(0);
    await details.getByRole('button', { name: 'Close' }).last().click();
    await expect(details).toBeHidden();
    // The table shows the same owned items.
    await demo.getByRole('radio', { name: 'Table' }).click();
    await expect(demo.getByRole('rowheader', { name: 'Dig raised beds' })).toBeVisible();
  });

  test('UIC-TIMELINE-1.1 UIC-TIMELINE-1.3 UIC-TIMELINE-1.5 lays out every zoom level on the scale', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const cells = page.locator('table[data-lab-matrix="scale mode"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 4);
    const day = matrixCell(page, 'scale=day mode=fixed');
    await expect(day.locator('.ui-timeline')).toHaveAttribute('data-scale', 'day');
    const shopping = await day.getByRole('button', { name: 'Shopping' }).boundingBox();
    const stew = await day.getByRole('button', { name: 'Slow stew' }).boundingBox();
    expect(Math.round(shopping?.width ?? 0)).toBe(5 * 32);
    expect(Math.round(stew?.width ?? 0)).toBe(14 * 32);
    await expect(day.locator('[data-tier="major"] .ui-timeline__scale-cell')).toHaveText([
      'March 2026',
    ]);
    const quarter = matrixCell(page, 'scale=quarter mode=fixed');
    await expect(quarter.locator('[data-tier="minor"] .ui-timeline__scale-cell')).toHaveText([
      'Q1',
      'Q2',
      'Q3',
      'Q4',
    ]);
    const progress = day
      .getByRole('button', { name: 'Chopping' })
      .locator('.ui-timeline__progress');
    expect(Math.round((await progress.boundingBox())?.width ?? 0)).toBe(5 * 16 - 1);
    await lab.expectAccessible();
  });

  test('UIC-TIMELINE-1.7 UIC-TIMELINE-1.8 UIC-TIMELINE-4.2 draws connectors, today and descriptions', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await expect(plan.locator('.ui-timeline__connector')).toHaveCount(9);
    await expect(plan.locator('.ui-timeline__connector[data-conflict]')).toHaveCount(1);
    const today = await plan.locator('.ui-timeline__today').boundingBox();
    const quotes = await plan.getByRole('button', { name: 'Collect quotes' }).boundingBox();
    expect(requireDefined(today).x).toBeGreaterThan(
      requireDefined(quotes).x + requireDefined(quotes).width,
    );
    const rewire = plan.getByRole('button', { name: 'Rewire' });
    await expect(rewire).toHaveAttribute('data-conflict', 'true');
    await expect(rewire).toHaveAccessibleDescription(
      'Mar 19, 2026 to Mar 27, 2026. Depends on Strip kitchen. Starts before an item it depends on ends. Arrow keys move it; Shift and arrow keys change its end',
    );
    await expect(plan.getByRole('group', { name: 'Electrical' })).toContainText('Rewire');
  });

  test('UIC-TIMELINE-2.1 moves and resizes a bar by dragging', async ({ page, lab }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const bar = plan.getByRole('button', { name: 'Strip kitchen' });
    await bar.scrollIntoViewIfNeeded();
    const box = requireDefined(await bar.boundingBox());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2, { steps: 5 });
    await expect(bar).toHaveAttribute('data-dragging', 'true');
    await page.mouse.up();
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Strip kitchen: Mar 18, 2026 to Mar 22, 2026',
    );
    await expect(bar).not.toHaveAttribute('data-dragging');
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 0');
    const moved = requireDefined(await bar.boundingBox());
    expect(Math.round(moved.x - box.x)).toBe(32);
    await page.mouse.move(moved.x + moved.width - 2, moved.y + moved.height / 2);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width + 30, moved.y + moved.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Strip kitchen: Mar 18, 2026 to Mar 24, 2026',
    );
  });

  test('UIC-TIMELINE-2.1 gives up a drag when the host reschedules its bar', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const lastChange = plan.locator('[data-lab-demo="last-change"]');
    const bar = plan.getByRole('button', { name: 'Strip kitchen' });
    await bar.scrollIntoViewIfNeeded();
    const box = requireDefined(await bar.boundingBox());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2, { steps: 5 });
    await expect(bar).toHaveAttribute('data-dragging', 'true');
    await plan.getByRole('button', { name: 'Postpone demolition' }).press('Space');
    await expect(bar).not.toHaveAttribute('data-dragging');
    await page.mouse.up();
    await expect(lastChange).toHaveText('Last change: None yet');
    await expect(bar).toHaveAccessibleDescription(/Mar 30, 2026.*Apr 3, 2026/);
    await bar.focus();
    await page.keyboard.press('ArrowRight');
    await expect(lastChange).toHaveText('Last change: Strip kitchen: Apr 6, 2026 to Apr 10, 2026');
  });

  test('UIC-TIMELINE-2.4 shows one selected item after switching to single selection', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const strip = plan.getByRole('button', { name: 'Strip kitchen' });
    const measure = plan.getByRole('button', { name: 'Measure rooms' });
    await measure.focus();
    await page.keyboard.press('Enter');
    await strip.focus();
    await page.keyboard.press('Enter');
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 2');
    await plan.getByRole('button', { name: 'Select one at a time' }).click();
    await expect(measure).toHaveAttribute('aria-pressed', 'true');
    await expect(strip).toHaveAttribute('aria-pressed', 'false');
    await strip.focus();
    await page.keyboard.press('Enter');
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 1');
    await expect(measure).toHaveAttribute('aria-pressed', 'false');
    await expect(strip).toHaveAttribute('aria-pressed', 'true');
    await lab.expectAccessible();
  });

  for (const direction of ['ltr', 'rtl'] as const) {
    test(`UIC-TIMELINE-1.2 keeps the bars under their dates at the range ends (${direction})`, async ({
      page,
      lab,
    }) => {
      await lab.open('timeline');
      const cell = page.locator(`[data-lab-demo="edges-${direction}"]`);
      await cell.scrollIntoViewIfNeeded();
      await expect(cell.getByRole('button', { name: 'Spring picnic' })).toHaveCount(0);
      const body = cell.locator('.ui-timeline__body');
      const header = cell.locator('.ui-timeline__header');
      const shopping = cell.getByRole('button', { name: 'Shopping' });
      const offset = async () =>
        requireDefined(await shopping.boundingBox()).x -
        requireDefined(await header.boundingBox()).x;
      const before = await offset();
      const scrolled = () => body.evaluate((element) => element.scrollLeft);
      await cell.getByRole('button', { name: 'Defrost' }).focus();
      for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
        await page.keyboard.press(key);
        expect(await scrolled()).toBe(0);
      }
      await cell.getByRole('button', { name: 'Pickling' }).focus();
      await cell.getByRole('button', { name: 'Tasting' }).focus();
      expect(await scrolled()).toBe(0);
      expect(await offset()).toBe(before);
      // Defrost starts before March, so it is cut where the range starts.
      const first = requireDefined(
        await cell.locator('.ui-timeline__scale-cell').first().boundingBox(),
      );
      const defrost = requireDefined(
        await cell.getByRole('button', { name: 'Defrost' }).boundingBox(),
      );
      const edge = (box: { x: number; width: number }) =>
        direction === 'ltr' ? box.x : box.x + box.width;
      expect(Math.abs(edge(defrost) - edge(first))).toBeLessThanOrEqual(1);
    });
  }

  test('UIC-TIMELINE-2.2 leaves arrow keys with Control or Alt alone', async ({ page, lab }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const lastChange = plan.locator('[data-lab-demo="last-change"]');
    await plan.getByRole('button', { name: 'Strip kitchen' }).focus();
    for (const chord of ['Control+ArrowRight', 'Alt+ArrowLeft', 'Control+Shift+ArrowRight']) {
      await page.keyboard.press(chord);
    }
    await expect(lastChange).toHaveText('Last change: None yet');
    await page.keyboard.press('Shift+ArrowRight');
    await expect(lastChange).toHaveText('Last change: Strip kitchen: Mar 16, 2026 to Mar 27, 2026');
  });

  for (const away of ['table', 'collapse'] as const) {
    test(`UIC-TIMELINE-2.1 drops a drag whose bar leaves the chart (${away})`, async ({
      page,
      lab,
    }) => {
      await lab.open('timeline');
      const plan = page.locator('[data-lab-demo="plan"]');
      const lastChange = plan.locator('[data-lab-demo="last-change"]');
      const bar = plan.getByRole('button', { name: 'Strip kitchen' });
      await bar.scrollIntoViewIfNeeded();
      const box = requireDefined(await bar.boundingBox());
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2, { steps: 5 });
      await expect(bar).toHaveAttribute('data-dragging', 'true');
      const group = plan.getByRole('button', { name: 'Build', exact: true });
      if (away === 'table') {
        await plan.getByRole('radio', { name: 'Table' }).press('Space');
        await expect(plan.locator('.ui-timeline')).toHaveAttribute('data-view', 'table');
      } else {
        await group.press('Enter');
      }
      await expect(bar).toHaveCount(0);
      await page.mouse.up();
      if (away === 'table') await plan.getByRole('radio', { name: 'Chart' }).press('Space');
      else await group.press('Enter');
      await expect(bar).not.toHaveAttribute('data-dragging');
      await bar.scrollIntoViewIfNeeded();
      expect(Math.round(requireDefined(await bar.boundingBox()).width)).toBe(Math.round(box.width));
      await expect(lastChange).toHaveText('Last change: None yet');
      await bar.focus();
      await page.keyboard.press('ArrowRight');
      await expect(lastChange).toHaveText(
        'Last change: Strip kitchen: Mar 23, 2026 to Mar 27, 2026',
      );
    });
  }

  test('UIC-TIMELINE-1.2 UIC-TIMELINE-2.1 UIC-TIMELINE-2.2 stops at the end of the supported range', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const end = page.locator('[data-lab-demo="range-end"]');
    const wrap = end.getByRole('button', { name: /^Wrap-up/ });
    await expect(end.getByRole('button', { name: /^Last day/ })).toBeVisible();
    await expect(end.getByRole('button', { name: /^Past the range/ })).toHaveCount(0);
    const body = await end.locator('.ui-timeline__scale-cell').last().boundingBox();
    const before = requireDefined(await wrap.boundingBox());
    expect(Math.round(before.width)).toBe(3 * 32);
    await wrap.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    const moved = requireDefined(await wrap.boundingBox());
    expect(Math.round(moved.x - before.x)).toBe(32);
    expect(Math.round(moved.width)).toBe(3 * 32);
    // The bar now ends with the last day, a full day wide at the end of the scale.
    expect(Math.round(moved.x + moved.width)).toBe(Math.round((body?.x ?? 0) + (body?.width ?? 0)));
    await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width / 2 + 5 * 32, moved.y + moved.height / 2, {
      steps: 5,
    });
    await page.mouse.up();
    expect(requireDefined(await wrap.boundingBox()).x).toBeCloseTo(moved.x, 0);
  });

  test('UIC-TIMELINE-2.2 UIC-TIMELINE-2.4 edits by keyboard and selects items', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    const rewire = plan.getByRole('button', { name: 'Rewire' });
    await rewire.focus();
    await page.keyboard.press('ArrowRight');
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Rewire: Mar 26, 2026 to Apr 3, 2026',
    );
    await expect(rewire).not.toHaveAttribute('data-conflict');
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Rewire: Mar 26, 2026 to Mar 27, 2026',
    );
    await expect(rewire).toBeFocused();
    await page.keyboard.press('Enter');
    await plan.getByRole('button', { name: 'Paint walls' }).click();
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 2');
    await expect(rewire).toHaveAttribute('data-selected', 'true');
  });

  test('UIC-TIMELINE-1.4 UIC-TIMELINE-1.9 collapses groups and keeps the scale and names pinned', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await plan.getByRole('radio', { name: 'Day' }).click();
    await expect(plan.locator('.ui-timeline')).toHaveAttribute('data-scale', 'day');
    const viewport = plan.locator('.ui-timeline__viewport');
    const header = plan.locator('.ui-timeline__header');
    const list = plan.locator('.ui-timeline__list');
    const before = {
      header: requireDefined(await header.boundingBox()),
      list: requireDefined(await list.boundingBox()),
    };
    await viewport.evaluate((node) => node.scrollTo({ left: 600, top: 120 }));
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    const after = {
      header: requireDefined(await header.boundingBox()),
      list: requireDefined(await list.boundingBox()),
    };
    expect(after.header.y).toBeCloseTo(before.header.y, 0);
    expect(after.list.x).toBeCloseTo(before.list.x, 0);
    await viewport.evaluate((node) => node.scrollTo({ left: 0, top: 0 }));
    await expect(plan.locator('.ui-timeline__row')).toHaveCount(11);
    await plan.getByRole('button', { name: 'Build', exact: true }).click();
    await expect(plan.locator('.ui-timeline__row')).toHaveCount(7);
    await expect(plan.getByRole('button', { name: 'Rewire' })).toHaveCount(0);
    await expect(plan.locator('.ui-timeline__connector')).toHaveCount(3);
  });

  test('UIC-TIMELINE-3.1 UIC-TIMELINE-4.1 switches to the table view', async ({ page, lab }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await plan.getByRole('radio', { name: 'Table' }).click();
    await expect(plan.locator('.ui-timeline')).toHaveAttribute('data-view', 'table');
    const table = plan.getByRole('grid', { name: 'Kitchen renovation' });
    await expect(table.getByRole('rowheader')).toHaveCount(9);
    await expect(table.getByRole('row').nth(1)).toContainText('Measure rooms');
    await expect(table.getByRole('row').nth(1)).toContainText('100%');
    await table.getByRole('row').nth(2).locator('.ui-table__checkbox').click();
    await expect(plan.locator('[data-lab-demo="selection"]')).toHaveText('Selected: 1');
    await lab.expectAccessible('[data-lab-demo="plan"]');
  });

  test('UIC-TIMELINE-1.11 UIC-TIMELINE-2.2 runs time from the right edge in a right-to-left locale', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const demo = page.locator('[data-lab-demo="rtl"]');
    const list = requireDefined(await demo.locator('.ui-timeline__list').boundingBox());
    const shopping = demo.getByRole('button', { name: 'Shopping' });
    const chopping = demo.getByRole('button', { name: 'Chopping' });
    const before = requireDefined(await chopping.boundingBox());
    const first = requireDefined(await shopping.boundingBox());
    expect(list.x).toBeGreaterThan(before.x + before.width);
    expect(first.x).toBeGreaterThan(before.x);
    await chopping.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(async () => (await chopping.boundingBox())?.x).toBeLessThan(before.x);
    await lab.expectAccessible('[data-lab-demo="rtl"]');
  });
});

for (const scale of [1.5, 0.5]) {
  test(`UIC-TIMELINE-2.1 keeps a dragged bar under the pointer inside scale(${scale})`, async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const plan = page.locator('[data-lab-demo="plan"]');
    await plan.evaluate((node, factor) => {
      Object.assign(node.style, { transform: `scale(${factor})`, transformOrigin: '0 0' });
    }, scale);
    const bar = plan.getByRole('button', { name: 'Strip kitchen' });
    await bar.scrollIntoViewIfNeeded();
    const box = requireDefined(await bar.boundingBox());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 35 * scale, box.y + box.height / 2, {
      steps: 5,
    });
    await page.mouse.up();
    await expect(plan.locator('[data-lab-demo="last-change"]')).toHaveText(
      'Last change: Strip kitchen: Mar 18, 2026 to Mar 22, 2026',
    );
    const moved = requireDefined(await bar.boundingBox());
    expect(Math.abs(moved.x - box.x - 32 * scale)).toBeLessThanOrEqual(1);
  });
}
