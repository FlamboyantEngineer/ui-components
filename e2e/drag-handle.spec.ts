import { expect, matrixCell, test } from './fixtures.js';

test.describe('Drag Handle lab', () => {
  test('UIC-DRAG-HANDLE-1.1 UIC-DRAG-HANDLE-1.2 reaches the handle from its row and drags by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('drag-handle');
    const list = page.locator('[data-lab-list="row"]');
    const banana = list.getByRole('row', { name: 'Banana', exact: true });
    const handle = list.getByRole('button', { name: 'Drag Banana' });
    await expect(handle).toHaveAttribute('tabindex', '-1');
    await banana.focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(banana).toHaveAttribute('data-dragging', 'true');
    await page.keyboard.press('Escape');
    await expect(banana).not.toHaveAttribute('data-dragging');
    await expect(list.locator('[data-lab-output]')).toHaveText('Order: Apple, Banana, Cherry, Fig');
    await lab.expectAccessible();
  });

  test('UIC-DRAG-HANDLE-1.2 UIC-LIST-ROW-3.5 draws one steady insertion line while dragging through the list', async ({
    page,
    lab,
  }) => {
    await lab.open('drag-handle');
    const list = page.locator('[data-lab-list="row"]');
    const output = list.locator('[data-lab-output]');
    /** The insertion lines drawn now, with their thickness and whether the list holds them. */
    const drawn = () =>
      list.evaluate((root) => {
        const view = root.querySelector('.ui-list-view')?.getBoundingClientRect();
        const indicators = [...root.querySelectorAll('.ui-list-view__drop-indicator')];
        const lines = indicators
          .filter(
            (node) => getComputedStyle(node, '::before').backgroundColor !== 'rgba(0, 0, 0, 0)',
          )
          .map((node) => {
            const style = getComputedStyle(node, '::before');
            const box = node.getBoundingClientRect();
            const top = box.top + Number.parseFloat(style.top);
            return {
              thickness: style.height,
              inside: !!view && top >= view.top && top + 2 <= view.bottom,
              isTarget: node.hasAttribute('data-drop-target'),
            };
          });
        return {
          lines,
          targets: indicators.filter((node) => node.hasAttribute('data-drop-target')).length,
          framed: root.querySelectorAll(':is(.ui-list-view, .ui-list-view-item)[data-drop-target]')
            .length,
        };
      });
    const rows = ['Apple', 'Banana', 'Cherry', 'Fig'].map((name) =>
      list.getByRole('row', { name, exact: true }),
    );
    const boxes = await Promise.all(rows.map((row) => row.boundingBox()));
    const [first, , cherry, last] = boxes;
    if (!first || !cherry || !last) throw new Error('no rows');
    for (const run of ['outside', 'drop'] as const) {
      const apple = await list.getByRole('row', { name: 'Apple', exact: true }).boundingBox();
      if (!apple) throw new Error('no row');
      await page.mouse.move(apple.x + 60, apple.y + apple.height / 2);
      await page.mouse.down();
      // Through every row and gap, past the list's end and back.
      for (let y = first.y + 2; y <= last.y + last.height + 30; y += 6) {
        await page.mouse.move(first.x + 60, y);
        const { lines, targets, framed } = await drawn();
        // Only the target's line, 2px thick and inside the list; nothing else framed.
        expect(lines.length).toBe(targets);
        expect(targets).toBeLessThanOrEqual(1);
        for (const line of lines)
          expect(line).toEqual({ thickness: '2px', inside: true, isTarget: true });
        expect(framed).toBe(0);
      }
      // A drop outside the list cancels the drag; the second run lands Apple after Cherry.
      const landing = run === 'outside' ? first.y - 120 : cherry.y + cherry.height - 3;
      await page.mouse.move(first.x + 60, landing, { steps: 4 });
      await page.mouse.move(first.x + 60, landing + 1);
      await page.mouse.up();
      await expect.poll(drawn).toEqual({ lines: [], targets: 0, framed: 0 });
    }
    await expect(output).toHaveText('Order: Banana, Cherry, Apple, Fig');

    // A keyboard drag mounts an indicator at every position, and draws only the target's line.
    const banana = list.getByRole('row', { name: 'Banana', exact: true });
    await banana.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(banana).toHaveAttribute('data-dragging', 'true');
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp']) {
      await page.keyboard.press(key);
      const { lines, targets } = await drawn();
      expect(lines.length).toBe(targets);
      expect(targets).toBe(1);
    }
    await page.keyboard.press('Escape');
    await expect.poll(drawn).toEqual({ lines: [], targets: 0, framed: 0 });
    await expect(output).toHaveText('Order: Banana, Cherry, Apple, Fig');
  });

  test('UIC-DRAG-HANDLE-1.3 disables the handle of a row that cannot move', async ({
    page,
    lab,
  }) => {
    await lab.open('drag-handle');
    await expect(
      page.locator('[data-lab-list="row"]').getByRole('button', { name: 'Drag Fig' }),
    ).toBeDisabled();
    const disabled = matrixCell(page, 'state=disabled').locator('.ui-drag-handle');
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(matrixCell(page, 'state=enabled').locator('.ui-drag-handle')).toBeEnabled();
  });

  test('UIC-DRAG-HANDLE-2.1 starts a pointer drag only from the handle', async ({ page, lab }) => {
    await lab.open('drag-handle');
    const list = page.locator('[data-lab-list="handle"]');
    const output = list.locator('[data-lab-output]');
    // A table row is named by its row header, which also holds the handle (Drag Apple Apple).
    const apple = list.getByRole('row', { name: 'Apple' });
    const cherry = list.getByRole('row', { name: 'Cherry' });
    await expect(apple).not.toHaveAttribute('draggable');
    await apple.dragTo(cherry, { sourcePosition: { x: 80, y: 10 } });
    await expect(output).toHaveText('Order: Apple, Banana, Cherry, Fig');
    const handle = await list.getByRole('button', { name: 'Drag Apple' }).boundingBox();
    const target = await cherry.boundingBox();
    if (!handle || !target) throw new Error('no handle');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 80, target.y + target.height - 3, { steps: 8 });
    await page.mouse.up();
    await expect(output).toHaveText('Order: Banana, Cherry, Apple, Fig');
    await expect(apple).not.toHaveAttribute('draggable');
    // A press the browser cancels before any drag starts leaves the row unarmed.
    const banana = list.getByRole('row', { name: 'Banana' });
    const bananaHandle = await list.getByRole('button', { name: 'Drag Banana' }).boundingBox();
    if (!bananaHandle) throw new Error('no handle');
    await page.mouse.move(bananaHandle.x + bananaHandle.width / 2, bananaHandle.y + 5);
    await page.mouse.down();
    await expect(banana).toHaveAttribute('draggable', 'true');
    await banana.dispatchEvent('pointercancel', { pointerId: 1, bubbles: true });
    await expect(banana).not.toHaveAttribute('draggable');
    await page.mouse.up();
    await banana.dragTo(cherry, { sourcePosition: { x: 80, y: 10 } });
    await expect(output).toHaveText('Order: Banana, Cherry, Apple, Fig');
    await lab.expectAccessible();
  });

  test('UIC-DRAG-HANDLE-1.1 joins the tab order when asked', async ({ page, lab }) => {
    await lab.open('drag-handle');
    const demo = page.locator('[data-lab-demo="tab-order"]');
    await demo.getByRole('textbox', { name: 'Before' }).focus();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('button', { name: 'Drag Notes.txt' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('textbox', { name: 'After' })).toBeFocused();
  });

  for (const mode of ['handle', 'row'] as const) {
    test(`UIC-DRAG-HANDLE-2.1 moves and cancels rows of a host grid dragged by ${mode}`, async ({
      page,
      lab,
    }) => {
      await lab.open('drag-handle');
      const host = page.locator(`[data-lab-host="${mode}"]`);
      await host.scrollIntoViewIfNeeded();
      const order = host.locator('[data-lab-output="order"]');
      const log = host.locator('[data-lab-output="log"] li');
      const drag = async (from: { x: number; y: number }, to: { x: number; y: number }) => {
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        await page.mouse.move(to.x, to.y, { steps: 8 });
        await page.mouse.up();
      };
      const centre = async (locator: ReturnType<typeof host.locator>) => {
        const box = await locator.boundingBox();
        if (!box) throw new Error('not visible');
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      };
      const cherry = await centre(host.getByRole('row', { name: 'Cherry' }));
      await drag(await centre(host.getByRole('button', { name: 'Drag Apple' })), cherry);
      await expect(order).toHaveText('Order: Banana, Cherry, Apple, Fig');
      await expect(log).toHaveText(['moved Apple after Cherry']);
      const apple = host.getByRole('row', { name: 'Apple' });
      if (mode === 'row') await expect(apple).toHaveAttribute('draggable', 'true');
      else await expect(apple).not.toHaveAttribute('draggable');

      const outside = await centre(host.locator('[data-lab-output="order"]'));
      await drag(await centre(host.getByRole('button', { name: 'Drag Fig' })), {
        x: outside.x + 400,
        y: outside.y,
      });
      await expect(log).toHaveText(['moved Apple after Cherry', 'cancelled Fig']);
      await expect(order).toHaveText('Order: Banana, Cherry, Apple, Fig');

      const bananaText = host.getByRole('row', { name: 'Banana' }).getByText('Banana');
      await drag(await centre(bananaText), await centre(host.getByRole('row', { name: 'Fig' })));
      if (mode === 'handle') {
        await expect(order).toHaveText('Order: Banana, Cherry, Apple, Fig');
        await expect(log).toHaveCount(2);
      } else {
        await expect(order).toHaveText('Order: Cherry, Apple, Fig, Banana');
      }
    });
  }
});
