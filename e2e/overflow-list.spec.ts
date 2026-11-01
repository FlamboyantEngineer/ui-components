import type { Locator } from '@playwright/test';
import { cellSelector, expect, test } from './fixtures.js';

const fruit = ['Apple', 'Banana', 'Cherry', 'Dragon fruit', 'Elderberry', 'Fig', 'Grape'];

async function keptItems(row: Locator): Promise<string[]> {
  return row.locator(':scope > .ui-overflow-list__item').allTextContents();
}

/** Asserts the kept items and the indicator never spill out of the row's box. */
async function expectInsideRow(row: Locator) {
  const box = await row.boundingBox();
  const last = row.locator(':scope > *').last();
  const first = row.locator(':scope > *').first();
  const lastBox = await last.boundingBox();
  const firstBox = await first.boundingBox();
  expect(firstBox?.x ?? -1).toBeGreaterThanOrEqual((box?.x ?? 0) - 0.5);
  expect((lastBox?.x ?? 0) + (lastBox?.width ?? 0)).toBeLessThanOrEqual(
    (box?.x ?? 0) + (box?.width ?? 0) + 0.5,
  );
}

test.describe('Overflow List lab', () => {
  test('UIC-OVERFLOW-LIST-1.1 UIC-OVERFLOW-LIST-1.2 keeps what fits at either end', async ({
    page,
    lab,
  }) => {
    await lab.open('overflow-list');
    const cell = (collapseFrom: string, width: string) =>
      page.locator(
        `${cellSelector(`collapseFrom=${collapseFrom} width=${width}`)} .ui-overflow-list`,
      );

    const wide = cell('end', 'wide');
    await expect(wide.locator('.ui-overflow-list__item')).toHaveCount(fruit.length);
    await expect(wide).not.toHaveAttribute('data-overflowing');
    await expect(wide.locator('.ui-overflow-list__overflow')).toHaveCount(0);

    for (const collapseFrom of ['end', 'start']) {
      for (const width of ['medium', 'narrow']) {
        const row = cell(collapseFrom, width);
        await expect(row).toHaveAttribute('data-overflowing', 'true');
        await expect(row).toHaveAttribute('data-collapse-from', collapseFrom);
        const kept = await keptItems(row);
        expect(kept.length).toBeGreaterThan(0);
        expect(kept.length).toBeLessThan(fruit.length);
        const expected =
          collapseFrom === 'end' ? fruit.slice(0, kept.length) : fruit.slice(-kept.length);
        expect(kept).toEqual(expected);
        const indicator = row.locator(':scope > .ui-overflow-list__overflow');
        await expect(indicator).toHaveText(`${fruit.length - kept.length} more`);
        const position = collapseFrom === 'end' ? 'last-child' : 'first-child';
        await expect(row.locator(`:scope > .ui-overflow-list__overflow:${position}`)).toHaveCount(
          1,
        );
        await expectInsideRow(row);
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-OVERFLOW-LIST-1.3 solves again as the frame resizes and lists the rest in a menu', async ({
    page,
    lab,
  }) => {
    await lab.open('overflow-list');
    const demo = page.locator('[data-lab-demo="resizable"]');
    const row = demo.locator('.ui-overflow-list');
    const slider = demo.getByRole('slider', { name: 'Width' });

    await slider.fill('560');
    await expect(row).not.toHaveAttribute('data-overflowing');
    await expect(row.locator('.ui-overflow-list__item')).toHaveCount(fruit.length);

    await slider.fill('200');
    await expect(row).toHaveAttribute('data-overflowing', 'true');
    const kept = await keptItems(row);
    expect(kept).toEqual(fruit.slice(0, kept.length));
    await expectInsideRow(row);

    const more = row.getByRole('button', { name: `${fruit.length - kept.length} more` });
    await more.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'More fruit' });
    await expect(menu.getByRole('menuitem')).toHaveText(fruit.slice(kept.length));
    await page.keyboard.press('Escape');
    await expect(more).toBeFocused();

    await slider.fill('80');
    await expect(row.locator('.ui-overflow-list__item')).toHaveCount(0);
    await expect(row.getByRole('button', { name: `${fruit.length} more` })).toBeVisible();
    await slider.fill('560');
    await expect(row.locator('.ui-overflow-list__item')).toHaveCount(fruit.length);
  });

  test('UIC-OVERFLOW-LIST-2.1 UIC-OVERFLOW-LIST-2.2 renders as a toolbar with arrow-key focus', async ({
    page,
    lab,
  }) => {
    await lab.open('overflow-list');
    const demo = page.locator('[data-lab-demo="toolbar"]');
    const toolbar = demo.getByRole('toolbar', { name: 'Text tools' });
    const list = demo.locator('.ui-overflow-list');
    await expect(list).toHaveAttribute('data-overflowing', 'true');
    await expect(list.getByRole('toolbar', { name: 'Text tools' })).toHaveClass(
      /ui-toolbar-row__strip/,
    );
    const visible = await toolbar.locator('.ui-overflow-list__item').allTextContents();
    expect(visible.length).toBeGreaterThan(1);

    await toolbar.getByRole('button', { name: visible[0] }).focus();
    for (const name of visible.slice(1)) {
      await page.keyboard.press('ArrowRight');
      await expect(toolbar.getByRole('button', { name })).toBeFocused();
    }
    await page.keyboard.press('ArrowRight');
    const more = toolbar.getByRole('button', { name: 'More tools' });
    await expect(more).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await expect(demo.locator('[data-lab-output="last"]')).toHaveText('Last tool: Link');
    await lab.expectAccessible();
  });

  test('UIC-OVERFLOW-LIST-1.8 keeps notes with their items as the list reorders and grows', async ({
    page,
    lab,
  }) => {
    await lab.open('overflow-list');
    const demo = page.locator('[data-lab-demo="notes"]');
    const row = demo.getByRole('group', { name: 'Notes' });
    const note = (name: string) => row.getByRole('textbox', { name });
    await note('Pear').fill('ripe');
    await note('Date').fill('sour');

    await demo.getByRole('button', { name: 'Reverse' }).click();
    await expect(row.locator('.ui-overflow-list__item')).toHaveText([
      'Date',
      'Lime',
      'Kiwi',
      'Pear',
      'Plum',
    ]);
    await expect(note('Date')).toHaveValue('sour');
    await expect(note('Pear')).toHaveValue('ripe');

    await demo.getByRole('button', { name: 'Add first' }).click();
    await expect(row).toHaveAttribute('data-overflowing', 'true');
    await expect(note('Fig')).toHaveValue('');
    await expect(note('Pear')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Remove first' }).click();
    await expect(row).not.toHaveAttribute('data-overflowing');
    await expect(note('Pear')).toHaveValue('');
    await expect(note('Date')).toHaveValue('sour');
    await lab.expectAccessible();
  });
});

test('UIC-OVERFLOW-LIST-1.4 shows the exported helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('overflow-list');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(
    call(
      'resolveOverflowCount({ sizes: [60, 60, 60, 60], available: 200, gap: 8, indicatorSize: 40 })',
    ),
  ).toHaveText('2');
});

for (const scale of [1.5, 0.5]) {
  test(`UIC-OVERFLOW-LIST-1.1 keeps as many items inside scale(${scale}) as unscaled`, async ({
    page,
    lab,
  }) => {
    const cell = `${cellSelector('collapseFrom=end width=medium')}`;
    await lab.open('overflow-list');
    const unscaled = await keptItems(page.locator(`${cell} .ui-overflow-list`));
    // The scale is in place before the row first measures.
    await page.addInitScript(
      ({ selector, factor }) => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent = `${selector} { transform: scale(${factor}); transform-origin: 0 0; }`;
          document.head.append(style);
        });
      },
      { selector: cell, factor: scale },
    );
    await lab.open('overflow-list');
    const row = page.locator(`${cell} .ui-overflow-list`);
    await expect(row).toHaveAttribute('data-overflowing', 'true');
    await expect.poll(() => keptItems(row)).toEqual(unscaled);
    await expectInsideRow(row);
  });
}
