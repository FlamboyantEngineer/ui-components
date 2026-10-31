import type { Locator } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

async function rects(locator: Locator) {
  return locator.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
}

test.describe('Description List lab', () => {
  test('UIC-DESCRIPTION-LIST-1.1 UIC-DESCRIPTION-LIST-1.3 aligns inline tracks and stacks values', async ({
    page,
    lab,
  }) => {
    await lab.open('description-list');
    const inline = matrixCell(page, 'layout=inline columns=1').locator('.ui-description-list');
    await expect(inline).toHaveAttribute('data-layout', 'inline');
    const values = (await rects(inline.locator('.ui-description-list__value'))) as DOMRect[];
    expect(new Set(values.map((box) => Math.round(box.left))).size).toBe(1);
    const labels = (await rects(inline.locator('.ui-description-list__label'))) as DOMRect[];
    expect(labels[0]?.right ?? 0).toBeLessThan(values[0]?.left ?? 0);
    const secondary = inline.locator('.ui-description-list__secondary');
    expect((await secondary.boundingBox())?.x).toBe(values[0]?.left);
    for (const value of await inline.locator('.ui-description-list__value').all()) {
      expect(await value.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }
    expect((await inline.boundingBox())?.width ?? 0).toBeLessThanOrEqual(420);

    const stacked = matrixCell(page, 'layout=stacked columns=1');
    const label = await stacked.locator('.ui-description-list__label').first().boundingBox();
    const value = await stacked.locator('.ui-description-list__value').first().boundingBox();
    expect(value?.y ?? 0).toBeGreaterThan(label?.y ?? 0);
    expect(Math.round(value?.x ?? 0)).toBe(Math.round(label?.x ?? 0));
    await expect(page.locator('dl').first()).toHaveCSS('font-size', '12px');
  });

  test('UIC-DESCRIPTION-LIST-1.3 lays two columns out side by side and one on a narrow viewport', async ({
    page,
    lab,
  }) => {
    await lab.open('description-list');
    const rows = page.locator(
      '[data-lab-cell="layout=inline columns=2"] .ui-description-list__row',
    );
    let boxes = (await rects(rows)) as DOMRect[];
    expect(Math.round(boxes[0]?.top ?? 0)).toBe(Math.round(boxes[1]?.top ?? 1));
    expect(boxes[1]?.left ?? 0).toBeGreaterThan(boxes[0]?.left ?? 0);
    await page.setViewportSize({ width: 600, height: 900 });
    boxes = (await rects(rows)) as DOMRect[];
    expect(boxes[1]?.top ?? 0).toBeGreaterThan(boxes[0]?.top ?? 0);
    expect(Math.round(boxes[1]?.left ?? 0)).toBe(Math.round(boxes[0]?.left ?? 1));
  });

  test('UIC-DESCRIPTION-LIST-2.2 keeps native semantics and caller focus handlers', async ({
    page,
    lab,
  }) => {
    await lab.open('description-list');
    const demo = page.locator('[data-lab-focusable]');
    const log = demo.locator('[data-lab-log]');
    const created = demo.locator('[data-lab-row="Created"]');
    await created.focus();
    await page.keyboard.press('Enter');
    await expect(log).toHaveText('Selected Created');
    await page.keyboard.press('Tab');
    await expect(demo.locator('[data-lab-row="Updated"]')).toBeFocused();
    await demo.locator('[data-lab-row="Updated"]').click({ button: 'right' });
    await expect(log).toHaveText('Context menu on Updated');
    await expect(page.locator('[data-lab-section="Layouts and columns"] [tabindex]')).toHaveCount(
      0,
    );
    await lab.expectAccessible();
  });

  test('UIC-DESCRIPTION-LIST-1.3 UIC-DESCRIPTION-LIST-1.4 lays out wider columns and spanning rows', async ({
    page,
    lab,
  }) => {
    await lab.open('description-list');
    for (const layout of ['inline', 'stacked'] as const) {
      const list = page.locator(
        `[data-lab-cell="layout=${layout} columns=4"] .ui-description-list`,
      );
      const rows = (await rects(list.locator('.ui-description-list__row'))) as DOMRect[];
      const listBox = requireDefined(await list.boundingBox());
      expect(new Set(rows.slice(0, 4).map((box) => Math.round(box.top))).size).toBe(1);
      const [single, pair, full] = [
        requireDefined(rows[0]),
        requireDefined(rows[4]),
        requireDefined(rows[5]),
      ];
      expect(pair.width).toBeGreaterThan(single.width * 1.8);
      expect(Math.round(full.width)).toBe(Math.round(listBox.width));
      expect(full.top).toBeGreaterThan(pair.top);
    }
    const three = matrixCell(page, 'layout=inline columns=3').locator('.ui-description-list');
    const rows = (await rects(three.locator('.ui-description-list__row'))) as DOMRect[];
    expect(requireDefined(rows[3]).top).toBeGreaterThan(requireDefined(rows[0]).top);
  });

  test('UIC-DESCRIPTION-LIST-1.3 UIC-DESCRIPTION-LIST-1.4 keeps a nested list in its own layout', async ({
    page,
    lab,
  }) => {
    await lab.open('description-list');
    for (const outer of ['inline', 'stacked'] as const) {
      for (const inner of ['inline', 'stacked'] as const) {
        const list = page.locator(
          `[data-lab-cell="outer=${outer} inner=${inner}"] [data-lab-inner]`,
        );
        const rows = list.locator(':scope > .ui-description-list__row');
        const boxes = (await rects(rows)) as DOMRect[];
        const [carrier, crates, route] = boxes.map((box) => requireDefined(box));
        const listBox = requireDefined(await list.boundingBox());
        // Two columns of rows, and a row spanning both.
        expect(Math.round(requireDefined(crates).top)).toBe(
          Math.round(requireDefined(carrier).top),
        );
        expect(requireDefined(crates).left).toBeGreaterThan(requireDefined(carrier).right - 1);
        expect(Math.round(requireDefined(route).width)).toBe(Math.round(listBox.width));
        const first = rows.first();
        const label = requireDefined(
          await first.locator('.ui-description-list__label').boundingBox(),
        );
        const value = requireDefined(
          await first.locator('.ui-description-list__value').boundingBox(),
        );
        const secondary = requireDefined(
          await first.locator('.ui-description-list__secondary').boundingBox(),
        );
        if (inner === 'inline') {
          expect(Math.round(value.y)).toBe(Math.round(label.y));
          expect(value.x).toBeGreaterThan(label.x + label.width - 1);
          expect(value.width).toBeGreaterThan(label.width);
        } else {
          expect(value.y).toBeGreaterThan(label.y);
          expect(Math.round(value.x)).toBe(Math.round(label.x));
        }
        expect(Math.round(secondary.x)).toBe(Math.round(value.x));
        expect(secondary.y).toBeGreaterThan(value.y);
      }
    }
    // Narrow viewports put every list, nested ones included, in one column.
    await page.setViewportSize({ width: 600, height: 900 });
    const rows = page.locator(
      '[data-lab-cell="outer=stacked inner=inline"] [data-lab-inner] > .ui-description-list__row',
    );
    const boxes = (await rects(rows)) as DOMRect[];
    expect(requireDefined(boxes[1]).top).toBeGreaterThan(requireDefined(boxes[0]).top);
  });

  test('UIC-DESCRIPTION-LIST-1.5 formats values for the provider locale', async ({ page, lab }) => {
    await lab.open('description-list');
    const values = (locale: string) =>
      page.locator(`[data-lab-locale="${locale}"] .ui-description-list__value`);
    const expected = await page.evaluate(() => {
      const picked = new Date(2024, 8, 14);
      const shipped = new Date(2024, 8, 21);
      const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
      return [
        '1,234.5',
        '€9.50',
        date.format(picked),
        'Apples, pears, and plums',
        new Intl.NumberFormat('en-US').formatRange(3, 7),
        date.formatRange(picked, shipped),
      ];
    });
    await expect(values('en-US')).toHaveText(expected);
    await expect(values('de-DE').first()).toHaveText('1.234,5');
    await expect(values('de-DE').nth(3)).toHaveText('Apples, pears und plums');
    await lab.expectAccessible();
  });
});

test('UIC-DESCRIPTION-LIST-1.5 shows the exported helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('description-list');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(
    call("formatDescriptionValue(['Oak', 'Ash', 'Elm'], { locale: 'en-US', timeZone: 'UTC' })"),
  ).toHaveText('Oak, Ash, and Elm');
  // An instant reads in the zone the host passes: the next day in Kiritimati.
  await expect(
    call(
      "formatDescriptionValue('2026-10-30T13:30:00Z', { locale: 'en-US', timeZone: 'Pacific/Kiritimati' })",
    ),
  ).toHaveText('Oct 31, 2026');
});
