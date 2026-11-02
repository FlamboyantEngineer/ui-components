import type { Locator } from '@playwright/test';
import { cellSelector, expect, matrixCell, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

async function innerWidth(locator: Locator) {
  return locator.evaluate((node) => node.clientWidth);
}

test.describe('Split View lab', () => {
  test('UIC-SPLIT-VIEW-1.1 places fixed panes side by side or stacked', async ({ page, lab }) => {
    await lab.open('split-view');
    const horizontal = page.locator(
      `${cellSelector('ratio=equal orientation=horizontal')} .ui-split-view > *`,
    );
    const [left, right] = [await box(horizontal.nth(0)), await box(horizontal.nth(1))];
    expect(left.y).toBe(right.y);
    expect(Math.abs(left.width - right.width)).toBeLessThanOrEqual(1);
    expect(right.x).toBeGreaterThan(left.x + left.width);

    const vertical = page.locator(
      `${cellSelector('ratio=equal orientation=vertical')} .ui-split-view > *`,
    );
    const [top, bottom] = [await box(vertical.nth(0)), await box(vertical.nth(1))];
    expect(top.x).toBe(bottom.x);
    expect(bottom.y).toBeGreaterThan(top.y + top.height);

    const rail = page.locator(
      `${cellSelector('ratio=main-rail orientation=horizontal')} .ui-split-view > *`,
    );
    expect((await box(rail.nth(1))).width).toBe(96);
    await expect(page.locator('[data-lab-section="Fixed ratios"] [role="separator"]')).toHaveCount(
      0,
    );
  });

  test('UIC-SPLIT-VIEW-2.1 UIC-SPLIT-VIEW-2.2 UIC-SPLIT-VIEW-3.1 paints the first pane at the separator value', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize horizontal split from 30%' });
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await expect(separator).toHaveAttribute('aria-valuenow', '30');
    await expect(separator).toHaveAttribute('aria-valuemin', '20');
    await expect(separator).toHaveAttribute('aria-valuemax', '80');
    await expect(separator).toHaveAttribute(
      'aria-controls',
      'horizontal-30-first horizontal-30-second',
    );
    const split = matrixCell(page, 'orientation=horizontal start=30').locator('.ui-split-view');
    const first = page.locator('#horizontal-30-first');
    expect(Math.round(((await box(first)).width / (await innerWidth(split))) * 100)).toBe(30);
    expect((await box(separator)).width).toBe(10);
    await expect(
      page.getByRole('separator', { name: 'Resize vertical split from 50%' }),
    ).toHaveAttribute('aria-orientation', 'horizontal');
    await lab.expectAccessible();
  });

  test('UIC-SPLIT-VIEW-3.2 resizes by keyboard within the bounds', async ({ page, lab }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize horizontal split from 30%' });
    const split = matrixCell(page, 'orientation=horizontal start=30').locator('.ui-split-view');
    await separator.focus();
    await page.keyboard.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', '35');
    const first = page.locator('#horizontal-30-first');
    expect(Math.round(((await box(first)).width / (await innerWidth(split))) * 100)).toBe(35);
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(separator).toHaveAttribute('aria-valuenow', '34');
    await page.keyboard.press('ArrowUp');
    await expect(separator).toHaveAttribute('aria-valuenow', '34');
    await page.keyboard.press('Home');
    await expect(separator).toHaveAttribute('aria-valuenow', '20');
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '80');
    await expect(split).not.toHaveAttribute('data-resizing');

    const stacked = page.getByRole('separator', { name: 'Resize vertical split from 50%' });
    await stacked.focus();
    await page.keyboard.press('ArrowDown');
    await expect(stacked).toHaveAttribute('aria-valuenow', '55');
  });

  test('UIC-SPLIT-VIEW-3.3 drags the separator with pointer capture behind a shield', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize horizontal split from 30%' });
    const split = matrixCell(page, 'orientation=horizontal start=30').locator('.ui-split-view');
    await separator.scrollIntoViewIfNeeded();
    const handle = await box(separator);
    const width = await innerWidth(split);
    const startX = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + width * 0.2, y, { steps: 4 });
    await expect(separator).toHaveAttribute('data-resizing', 'true');
    await expect(split).toHaveAttribute('data-resizing', 'true');
    const shield = page.locator('.ui-resize-handle__shield');
    await expect(shield).toHaveCount(1);
    expect(await shield.evaluate((node) => getComputedStyle(node).cursor)).toBe('col-resize');
    // On the top overlay layer, it covers the whole viewport above everything else.
    await expect(page.locator('.ui-portal[data-layer="toast"]', { has: shield })).toHaveCSS(
      'z-index',
      '160',
    );
    expect(
      await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.classList.contains('ui-resize-handle__shield'),
        { x: startX - 60, y },
      ),
    ).toBe(true);
    // The pointer stays captured when it leaves the split.
    await page.mouse.move(startX + width * 0.2, y + 400, { steps: 2 });
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow', '50');
    await expect(separator).not.toHaveAttribute('data-resizing');
    await expect(shield).toHaveCount(0);
  });

  test('UIC-SPLIT-VIEW-3.4 draws separators by size and keeps them usable', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const thickness: number[] = [];
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      const separator = page.getByRole('separator', {
        name: `Resize horizontal split, ${size} separator`,
      });
      await expect(separator).toHaveAttribute('data-size', size);
      thickness.push((await box(separator)).width);
    }
    expect([...thickness].sort((a, b) => a - b)).toEqual(thickness);
    expect(thickness[0]).toBeGreaterThanOrEqual(6);
    const smallest = page.getByRole('separator', { name: 'Resize vertical split, xs separator' });
    await smallest.focus();
    await page.keyboard.press('ArrowDown');
    await expect(smallest).not.toHaveAttribute('aria-valuenow', '50');
    await lab.expectAccessible('[data-lab-section="Separator sizes"]');
  });

  test('UIC-SPLIT-VIEW-2.4 restores a persisted size after a reload', async ({ page, lab }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize persisted panes' });
    await expect(separator).toHaveAttribute('aria-valuenow', '40');
    await separator.focus();
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '60');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(page.getByRole('separator', { name: 'Resize persisted panes' })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
  });

  test('UIC-SPLIT-VIEW-2.4 abandons a drag when the layout switches to another key', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const separator = page.getByRole('separator', { name: 'Resize layout panes' });
    const split = page.locator('[data-lab-split="layouts"] .ui-split-view');
    const editing = page.getByRole('radio', { name: 'Editing' });
    await editing.check();
    await separator.focus();
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '90');
    await page.getByRole('radio', { name: 'Reading' }).check();
    await expect(separator).toHaveAttribute('aria-valuenow', '40');

    await separator.scrollIntoViewIfNeeded();
    const handle = await box(separator);
    const width = await innerWidth(split);
    const startX = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + width * 0.1, y, { steps: 3 });
    await expect(separator).toHaveAttribute('aria-valuenow', '50');
    // The switch lands while the button is still held.
    await editing.evaluate((node: HTMLInputElement) => node.click());
    await expect(separator).toHaveAttribute('aria-valuenow', '90');
    await expect(separator).not.toHaveAttribute('data-resizing');
    await expect(page.locator('.ui-resize-handle__shield')).toHaveCount(0);
    await page.mouse.move(startX + width * 0.2, y, { steps: 2 });
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow', '90');
    await page.getByRole('radio', { name: 'Reading' }).check();
    await expect(separator).toHaveAttribute('aria-valuenow', '40');
  });

  test('UIC-SPLIT-VIEW-3.2 grows the first pane with the Left arrow right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const first = await box(page.locator('#rtl-first'));
    const second = await box(page.locator('#rtl-second'));
    expect(first.x).toBeGreaterThan(second.x);
    const separator = page.getByRole('separator', { name: 'Resize right-to-left panes' });
    await separator.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(separator).toHaveAttribute('aria-valuenow', '45');
  });

  test('UIC-SPLIT-VIEW-2.1 UIC-SPLIT-VIEW-2.2 resizes three panes pair by pair', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const cell = matrixCell(page, 'orientation=horizontal');
    const split = cell.locator('.ui-split-view');
    await expect(split.getByRole('separator')).toHaveCount(2);
    const width = await innerWidth(split);
    const share = async (id: string) =>
      Math.round(((await box(page.locator(`#${id}`))).width / width) * 100);
    expect(await share('horizontal-folders')).toBe(25);
    expect(await share('horizontal-messages')).toBe(35);
    const second = page.getByRole('separator', { name: 'Resize Messages, horizontal' });
    await expect(second).toHaveAttribute('aria-controls', 'horizontal-messages horizontal-reading');
    await second.focus();
    await page.keyboard.press('ArrowRight');
    await expect(second).toHaveAttribute('aria-valuenow', '40');
    expect(await share('horizontal-messages')).toBe(40);
    expect(await share('horizontal-folders')).toBe(25);
    await expect(page.locator('#horizontal-reading')).toHaveAttribute('data-flexible', 'true');
    await lab.expectAccessible();
  });

  test('UIC-SPLIT-VIEW-2.5 keeps pixel panes at their width and drags them pixel for pixel', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    for (const width of [480, 720]) {
      expect((await box(page.locator(`#pixel-${width}-rail`))).width).toBe(160);
      expect((await box(page.locator(`#pixel-${width}-inspector`))).width).toBe(120);
    }
    const narrow = (await box(page.locator('#pixel-480-canvas'))).width;
    const wide = (await box(page.locator('#pixel-720-canvas'))).width;
    expect(Math.round(wide - narrow)).toBe(240);

    const separator = page.getByRole('separator', { name: 'Resize rail, 720px' });
    await separator.scrollIntoViewIfNeeded();
    await expect(separator).toHaveAttribute('aria-valuenow', '160');
    await expect(separator).toHaveAttribute('aria-valuemax', '280');
    const handle = await box(separator);
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50, y, { steps: 3 });
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow', '210');
    expect((await box(page.locator('#pixel-720-rail'))).width).toBe(210);
    const inspector = page.getByRole('separator', { name: 'Resize canvas, 720px' });
    await inspector.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(inspector).toHaveAttribute('aria-valuenow', '156');
  });

  test('UIC-SPLIT-VIEW-2.5 keeps every pane of an all-pixel split at its width', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    for (const width of [480, 720]) {
      expect((await box(page.locator(`#all-pixel-${width}-tools`))).width).toBe(100);
      expect((await box(page.locator(`#all-pixel-${width}-layers`))).width).toBe(200);
    }
    const separator = page.getByRole('separator', { name: 'Resize tools, 720px' });
    await separator.scrollIntoViewIfNeeded();
    await expect(separator).toHaveAttribute('aria-valuemax', '250');
    const handle = await box(separator);
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 300, y, { steps: 3 });
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow', '250');
    expect((await box(page.locator('#all-pixel-720-tools'))).width).toBe(250);
    const layers = page.locator('#all-pixel-720-layers');
    expect((await box(layers)).width).toBe(200);
    await separator.focus();
    await page.keyboard.press('Enter');
    await expect(layers).toHaveAttribute('data-collapsed', 'true');
    expect((await layers.boundingBox())?.width ?? 0).toBe(0);
    await page.keyboard.press('Enter');
    await expect(layers).not.toHaveAttribute('data-collapsed');
    expect((await box(layers)).width).toBe(200);
  });

  test('UIC-SPLIT-VIEW-2.6 UIC-SPLIT-VIEW-2.7 collapses panes by drag, Enter and the handle', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const host = page.locator('[data-lab-split="collapsible"]');
    await host.scrollIntoViewIfNeeded();
    const log = page.locator('[data-lab-output="collapse"]');
    const preview = page.locator('#collapsible-preview');
    const separator = host.getByRole('separator', { name: 'Resize Messages', exact: true });
    const handle = await box(separator);
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    const split = host.locator('.ui-split-view');
    const width = await innerWidth(split);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + width * 0.25, y, { steps: 4 });
    await page.mouse.up();
    await expect(preview).toHaveAttribute('data-collapsed', 'true');
    await expect(preview).toHaveAttribute('inert', '');
    await expect(log).toHaveText('Collapsed Reading');
    expect((await box(preview)).width).toBeLessThanOrEqual(1);

    await separator.focus();
    await page.keyboard.press('Enter');
    await expect(preview).not.toHaveAttribute('data-collapsed');
    await expect(log).toHaveText('Expanded Reading');
    expect((await box(preview)).width).toBeGreaterThan(width * 0.15);

    const nav = page.locator('#collapsible-nav');
    const navSeparator = host.getByRole('separator', { name: 'Resize Folders', exact: true });
    await navSeparator.focus();
    await page.keyboard.press('Home');
    await expect(nav).toHaveAttribute('data-collapsed', 'true');
    expect(Math.round(((await box(nav)).width / width) * 100)).toBe(4);

    await page.getByRole('button', { name: 'Collapse preview' }).click();
    await expect(preview).toHaveAttribute('data-collapsed', 'true');
    await page.getByRole('button', { name: 'Expand preview' }).click();
    await expect(preview).not.toHaveAttribute('data-collapsed');
    await page.getByRole('button', { name: 'Reset sizes' }).click();
    await expect(nav).not.toHaveAttribute('data-collapsed');
    await expect(navSeparator).toHaveAttribute('aria-valuenow', '25');
    await lab.expectAccessible();
  });
});

test('UIC-SPLIT-VIEW-3.4 shows the exported helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('split-view');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(
    call("resolveResizeKeyboardValue({ key: 'ArrowRight', shiftKey: true }, input)"),
  ).toHaveText('51');
});

test("UIC-SPLIT-VIEW-2.1 keeps a pane's draft, focus and share as a pane opens before it", async ({
  page,
  lab,
}) => {
  await lab.open('split-view');
  const demo = page.locator('[data-lab-split="opening"]');
  await demo.getByRole('separator').focus();
  await page.keyboard.press('Shift+ArrowRight');
  const list = demo.locator('#opening-list');
  const before = await list.evaluate((node) => node.getBoundingClientRect().width);
  const note = demo.getByRole('textbox', { name: 'List note' });
  await note.fill('Ripe');
  const toggle = demo.getByRole('checkbox', { name: 'Show filters' });
  // Toggle without moving focus, as a host command would.
  await toggle.evaluate((node) => (node as HTMLInputElement).click());
  await expect(demo.getByText('Filters', { exact: true })).toBeVisible();
  await expect(note).toBeFocused();
  await expect(note).toHaveValue('Ripe');
  await expect(list).toHaveAttribute('style', /\b51%/);
  await toggle.evaluate((node) => (node as HTMLInputElement).click());
  await expect(demo.getByText('Filters', { exact: true })).toHaveCount(0);
  await expect(note).toHaveValue('Ripe');
  expect(await list.evaluate((node) => node.getBoundingClientRect().width)).toBeCloseTo(before, 0);
});

for (const scale of [1.5, 0.5]) {
  test(`UIC-SPLIT-VIEW-3.3 keeps the dragged edge under the pointer inside scale(${scale})`, async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const rail = page.locator('#pixel-720-rail');
    await rail.evaluate((node, factor) => {
      const host = node.closest('.ui-split-view')?.parentElement;
      if (host)
        Object.assign(host.style, { transform: `scale(${factor})`, transformOrigin: '0 0' });
    }, scale);
    const separator = page.getByRole('separator', { name: 'Resize rail, 720px' });
    await separator.scrollIntoViewIfNeeded();
    const handle = await box(separator);
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50 * scale, y, { steps: 3 });
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow', '210');
    const moved = await box(separator);
    expect(Math.abs(moved.x + moved.width / 2 - (x + 50 * scale))).toBeLessThanOrEqual(1);
  });
}

test.describe('Split View controls', () => {
  test('UIC-SPLIT-VIEW-2.3 reports live and committed sizes of controlled mixed panes', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const demo = page.locator('[data-lab-split="controlled-panes"]');
    const live = demo.locator('[data-lab-output="live"]');
    const committed = demo.locator('[data-lab-output="committed"]');
    await expect(live).toHaveText('160px, 40%, 60%');
    const separator = demo.getByRole('separator', { name: 'Resize Messages, controlled' });
    await separator.scrollIntoViewIfNeeded();
    const handle = await box(separator);
    const y = handle.y + handle.height / 2;
    await page.mouse.move(handle.x + handle.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 40, y, { steps: 4 });
    await expect(live).not.toHaveText('160px, 40%, 60%');
    await expect(committed).toHaveText('none yet');
    await page.mouse.up();
    await expect(committed).toHaveText(await live.innerText());

    await demo.getByRole('button', { name: 'Wide folders' }).click();
    await expect(live).toHaveText('200px, 30%, 70%');
    await expect(
      demo.getByRole('separator', { name: 'Resize Folders, controlled' }),
    ).toHaveAttribute('aria-valuenow', '200');
    await demo.getByRole('button', { name: 'Collapse folders' }).click();
    await expect(committed).toHaveText(/^0px, /);
    await demo.getByRole('button', { name: 'Expand folders' }).click();
    await expect(committed).toHaveText(/^200px, /);
    await lab.expectAccessible();
  });

  test('UIC-SPLIT-VIEW-3.3 UIC-SPLIT-VIEW-3.4 scales pointer travel and cancels a drag its owner abandons', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const demo = page.locator('[data-lab-handle="rows"]');
    const events = demo.locator('[data-lab-output="handle-events"] li');
    const drag = async (distance: number, release = true) => {
      const separator = demo.getByRole('separator', { name: 'Resize the shopping list' });
      await separator.scrollIntoViewIfNeeded();
      const handle = await box(separator);
      const x = handle.x + handle.width / 2;
      const y = handle.y + handle.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + distance, { steps: 4 });
      if (release) await page.mouse.up();
    };
    await drag(40);
    await expect(events.last()).toHaveText('end 6.00 rows');
    await expect(events.filter({ hasText: 'cancel' })).toHaveCount(0);

    for (const [choice, check] of [
      ['Change resetKey', () => expect(demo.locator('[data-lab-output="owner"]')).toHaveText('1')],
      [
        'Disable the handle',
        () => expect(demo.getByRole('separator')).toHaveAttribute('aria-disabled', 'true'),
      ],
      ['Unmount the handle', () => expect(demo.getByRole('separator')).toHaveCount(0)],
    ] as const) {
      await demo.getByRole('button', { name: 'Restore the handle' }).click();
      await demo.getByRole('radio', { name: choice }).click();
      await drag(-20, false);
      await check();
      await expect(events.last()).toHaveText('cancel');
      await page.mouse.up();
      await expect(events.filter({ hasText: /^end/ })).toHaveCount(0);
    }
  });

  test('UIC-SPLIT-VIEW-1.1 spaces fixed panes and grows, fills or clips in a bounded host', async ({
    page,
    lab,
  }) => {
    await lab.open('split-view');
    const gap = async (space: string) => {
      const panes = page.locator(`[data-lab-space="${space}"] > *`);
      const [a, b] = [await box(panes.nth(0)), await box(panes.nth(1))];
      return b.x - (a.x + a.width);
    };
    expect(await gap('none')).toBeLessThan(1);
    expect(await gap('3xl')).toBeGreaterThan(await gap('xs'));
    const contained = (name: string) => page.locator(`[data-lab-containment="${name}"]`);
    await expect(contained('grow')).toHaveAttribute('data-grow', 'true');
    expect((await box(contained('grow'))).height).toBeCloseTo(80, 0);
    await expect(contained('fill')).toHaveAttribute('data-fill', 'true');
    await expect(contained('clip')).toHaveAttribute('data-clip', 'true');
    expect(await contained('clip').evaluate((node) => getComputedStyle(node).overflow)).toBe(
      'hidden',
    );
  });
});
