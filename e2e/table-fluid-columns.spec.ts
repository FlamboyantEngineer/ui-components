import { expect, test } from './fixtures.js';

test.describe('Table fluid columns', () => {
  test('UIC-TABLE-4.6 flexible columns follow the container in the same layout, before any resize observer', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab="fluid-columns"]');
    // Only the parent's width changes, and each layout is read in the same task: no resize
    // observer has run between the change and the reading.
    const layouts = await demo.locator('[data-lab-fluid-space]').evaluate((space: HTMLElement) =>
      [520, 430, 560, 380, 260].map((width) => {
        space.style.width = `${width}px`;
        const scroll = space.querySelector<HTMLElement>('.ui-table__scroll');
        const grid = space.querySelector<HTMLElement>('.ui-table__header > tr');
        const [name, state] = space.querySelectorAll<HTMLElement>('[role="columnheader"]');
        return {
          available: scroll?.clientWidth ?? 0,
          grid: grid?.getBoundingClientRect().width ?? 0,
          name: name?.getBoundingClientRect().width ?? 0,
          state: state?.getBoundingClientRect().width ?? 0,
        };
      }),
    );
    for (const layout of layouts) {
      const width = Math.max(layout.available, 300);
      expect(Math.abs(layout.grid - width)).toBeLessThan(1);
      expect(Math.abs(layout.state - 100)).toBeLessThan(1);
      expect(Math.abs(layout.name - (width - 100))).toBeLessThan(1);
    }
    // The narrowest scrolls at the declared minima: 200 for Name and 100 for State.
    expect(layouts.at(-1)?.available).toBeLessThan(300);
  });

  test('UIC-TABLE-4.6 follows a dragged side panel and resizes a column to a fixed track', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab="fluid-columns"]');
    const separator = demo.getByRole('separator', { name: 'Resize the side panel' });
    await separator.scrollIntoViewIfNeeded();
    const box = await separator.boundingBox();
    if (!box) throw new Error('The separator must have a box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (const step of [60, 120, -40]) {
      await page.mouse.move(box.x + box.width / 2 + step, box.y + box.height / 2);
      const fit = await demo.evaluate((root) => {
        const scroll = root.querySelector<HTMLElement>('.ui-table__scroll');
        const grid = root.querySelector<HTMLElement>('.ui-table__header > tr');
        return Math.abs(
          (grid?.getBoundingClientRect().width ?? 0) - Math.max(scroll?.clientWidth ?? 0, 300),
        );
      });
      expect(fit).toBeLessThan(1);
    }
    await page.mouse.up();
    const name = demo.getByRole('columnheader', { name: /^Name/ });
    const resizer = demo.locator('.ui-table__resizer');
    const edge = await resizer.boundingBox();
    if (!edge) throw new Error('The resizer must have a box');
    const before = (await name.boundingBox())?.width ?? 0;
    await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2);
    await page.mouse.down();
    await page.mouse.move(edge.x + edge.width / 2 + 30, edge.y + edge.height / 2, { steps: 3 });
    await expect(resizer).toHaveAttribute('data-resizing', 'true');
    await page.mouse.up();
    await expect(resizer).not.toHaveAttribute('data-resizing');
    const after = (await name.boundingBox())?.width ?? 0;
    expect(Math.abs(after - (Math.round(before) + 30))).toBeLessThan(1.5);
    const tracks = await demo
      .locator('.ui-table__grid')
      .evaluate((grid: HTMLElement) => grid.style.getPropertyValue('--ui-table-columns'));
    expect(tracks).toBe(`${Math.round(after)}px 100px`);
    await lab.expectAccessible('[data-lab="fluid-columns"]');
  });

  test('UIC-TABLE-4.6 keeps share weights under caps and matches the virtualized widths', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab="share-weights"]');
    await demo.scrollIntoViewIfNeeded();
    const widths = (name: string) =>
      demo.getByRole('grid', { name, exact: true }).evaluate((grid) =>
        ['Name', 'Kind', 'Size', 'Note'].map((label) => {
          const header = [...grid.querySelectorAll('[role="columnheader"]')].find((cell) =>
            cell.textContent?.startsWith(label),
          );
          return header?.getBoundingClientRect().width ?? 0;
        }),
      );
    for (const host of [640, 900, 480]) {
      await demo.evaluate((root: HTMLElement, width) => {
        root.style.width = `${width}px`;
      }, host);
      const fixed = await widths('Weighted columns');
      const [name = 0, kind = 0, size = 0, note = 0] = fixed;
      expect(Math.abs(kind - 2 * name)).toBeLessThan(1.5);
      expect(Math.abs(size - 90)).toBeLessThan(1);
      expect(Math.abs(note - Math.max(100, 2 * name))).toBeLessThan(1.5);
      await expect
        .poll(async () =>
          Math.max(
            ...(await widths('Weighted columns, virtualized')).map((width, index) =>
              Math.abs(width - (fixed[index] ?? 0)),
            ),
          ),
        )
        .toBeLessThan(2);
    }
    await lab.expectAccessible('[data-lab="share-weights"]');
  });
});
