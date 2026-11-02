import type { Locator } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

test.describe('Four Side Property Strip lab', () => {
  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.1 lays the four sides out on one line in order', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const cell = matrixCell(page, 'state=unit layout=responsive');
    const sides = cell.locator('.ui-four-side-property-strip__side');
    await expect(sides).toHaveCount(4);
    await expect(sides.locator('.ui-property-strip-cell__letter')).toHaveText(['T', 'B', 'L', 'R']);
    const boxes = await sides.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect),
    );
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index]?.x).toBeGreaterThan(boxes[index - 1]?.x ?? 0);
      expect(Math.round(boxes[index]?.y ?? 0)).toBe(Math.round(boxes[0]?.y ?? 0));
    }
    const left = cell.getByRole('textbox', { name: 'Margin unit responsive left' });
    await left.fill('24');
    await expect(left).toHaveValue('24');
    await expect(cell.getByRole('group', { name: 'Margins' })).toBeVisible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.2 keeps the row for a side name and hides it otherwise', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const filtered = page.locator('[data-lab-filtered]');
    const strip = filtered.locator('.ui-four-side-property-strip');
    await expect(strip).toBeVisible();
    await filtered.getByLabel('Query').fill('colour');
    await expect(strip).toBeHidden();
    await filtered.getByLabel('Query').fill('bottom');
    await expect(strip).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 links each opposite pair on its own or all four', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const pairs = matrixCell(page, 'link=pairs start=none');
    const side = (area: typeof pairs, prefix: string, name: string) =>
      area.getByRole('textbox', { name: `Padding ${prefix} ${name}` });
    const vertical = pairs.getByRole('button', { name: 'Link top and bottom' });
    const horizontal = pairs.getByRole('button', { name: 'Link left and right' });
    await expect(vertical).toHaveAttribute('aria-pressed', 'false');
    await expect(horizontal).toHaveAttribute('aria-pressed', 'false');
    // By keyboard: Tab from the last cell reaches the first pair's toggle, then the second's.
    await side(pairs, 'pairs none', 'right').focus();
    await page.keyboard.press('Tab');
    await expect(vertical).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(horizontal).toBeFocused();
    await page.keyboard.press('Space');
    await expect(horizontal).toHaveAttribute('aria-pressed', 'true');
    await expect(vertical).toHaveAttribute('aria-pressed', 'false');
    await side(pairs, 'pairs none', 'left').fill('20');
    await expect(side(pairs, 'pairs none', 'right')).toHaveValue('20');
    await side(pairs, 'pairs none', 'top').fill('3');
    await expect(side(pairs, 'pairs none', 'bottom')).toHaveValue('8');
    await vertical.click();
    await side(pairs, 'pairs none', 'bottom').fill('5');
    await expect(side(pairs, 'pairs none', 'top')).toHaveValue('5');
    await expect(side(pairs, 'pairs none', 'left')).toHaveValue('20');

    // Every combination starts as given: neither, either pair, or both.
    for (const [start, pressed] of [
      ['vertical', ['true', 'false']],
      ['horizontal', ['false', 'true']],
      ['both', ['true', 'true']],
    ] as const) {
      const toggles = matrixCell(page, `link=pairs start=${start}`).getByRole('button');
      await expect(toggles).toHaveCount(2);
      for (const [index, state] of pressed.entries()) {
        await expect(toggles.nth(index)).toHaveAttribute('aria-pressed', state);
      }
    }

    // All four sides are linked only while both pairs are.
    await expect(
      matrixCell(page, 'link=all start=vertical').getByRole('button', { name: 'Link all sides' }),
    ).toHaveAttribute('aria-pressed', 'false');
    const all = matrixCell(page, 'link=all start=both');
    await side(all, 'all both', 'bottom').fill('6');
    for (const name of ['top', 'left', 'right']) {
      await expect(side(all, 'all both', name)).toHaveValue('6');
    }
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 keeps one link state across modes', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const demo = page.locator('[data-lab-demo="switching"]');
    const output = demo.locator('[data-lab-output="linked"]');
    await expect(output).toHaveText('Linked pairs: horizontal');
    await demo.getByRole('checkbox').check();
    const all = demo.getByRole('button', { name: 'Link all sides' });
    await expect(all).toHaveAttribute('aria-pressed', 'false');
    await all.click();
    await expect(output).toHaveText('Linked pairs: vertical, horizontal');
    await demo.getByRole('checkbox').uncheck();
    await expect(demo.getByRole('button', { name: 'Link top and bottom' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await demo.getByRole('button', { name: 'Link left and right' }).click();
    await expect(output).toHaveText('Linked pairs: vertical');
    await demo.getByRole('textbox', { name: 'Margin switching left' }).fill('2');
    await expect(demo.getByRole('textbox', { name: 'Margin switching right' })).toHaveValue('8');
    await demo.getByRole('textbox', { name: 'Margin switching top' }).fill('4');
    await expect(demo.getByRole('textbox', { name: 'Margin switching bottom' })).toHaveValue('4');
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.4 orders flow-relative sides by the reading direction', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const xOf = (direction: string, name: string) =>
      page
        .getByRole('textbox', { name: `Inset ${direction} ${name}` })
        .evaluate((element) => element.getBoundingClientRect().x);
    const rtl = matrixCell(page, 'direction=rtl');
    await expect(rtl.locator('.ui-property-strip-cell__letter')).toHaveText(['T', 'B', 'S', 'E']);
    expect(await xOf('rtl', 'inline-start')).toBeGreaterThan(await xOf('rtl', 'inline-end'));
    expect(await xOf('ltr', 'inline-start')).toBeLessThan(await xOf('ltr', 'inline-end'));
    await expect(rtl.locator('[data-side="inline-start"]')).toHaveCount(1);
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.6 brackets the linked controls below them in either direction', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const boxOf = (locator: Locator) =>
      locator.evaluate((node) => node.getBoundingClientRect().toJSON() as DOMRect);
    const check = async (cell: string, label: string, groups: string[][]) => {
      const area = matrixCell(page, cell);
      const brackets = area.locator('.ui-four-side-property-strip__bracket');
      await expect(brackets).toHaveCount(groups.length);
      for (const [index, group] of groups.entries()) {
        const bracket = await boxOf(brackets.nth(index));
        const fields = await Promise.all(
          group.map((name) => boxOf(area.getByRole('textbox', { name: `${label} ${name}` }))),
        );
        const left = Math.min(...fields.map((field) => field.left));
        const right = Math.max(...fields.map((field) => field.right));
        const bottom = Math.max(...fields.map((field) => field.bottom));
        // The ends meet the group's outer controls, and the bracket sits just below them.
        expect(Math.abs(bracket.left - left), `${cell} ${index} start`).toBeLessThanOrEqual(1);
        expect(Math.abs(bracket.right - right), `${cell} ${index} end`).toBeLessThanOrEqual(1);
        expect(bracket.top).toBeGreaterThanOrEqual(bottom);
        expect(bracket.top - bottom).toBeLessThan(6);
        const icon = await boxOf(brackets.nth(index).locator('svg'));
        const middle = (bracket.left + bracket.right) / 2;
        expect(Math.abs(icon.left + icon.width / 2 - middle)).toBeLessThanOrEqual(1.5);
      }
    };
    await check('link=pairs start=both', 'Padding pairs both', [
      ['top', 'bottom'],
      ['left', 'right'],
    ]);
    await check('link=all start=none', 'Padding all none', [['top', 'bottom', 'left', 'right']]);
    await check('link=pairs direction=rtl', 'Inset pairs rtl', [
      ['block-start', 'block-end'],
      ['inline-start', 'inline-end'],
    ]);
    await check('link=all direction=rtl', 'Inset all rtl', [
      ['block-start', 'block-end', 'inline-start', 'inline-end'],
    ]);
    // Unlinked rules are dashed; linked ones solid, each pair's on its own.
    const bracketStyle = (cell: string, index: number) =>
      matrixCell(page, cell)
        .locator('.ui-four-side-property-strip__bracket')
        .nth(index)
        .evaluate((node) => {
          const rule = getComputedStyle(node, '::before');
          return { style: rule.borderBottomStyle, radius: parseFloat(rule.borderBottomLeftRadius) };
        });
    expect((await bracketStyle('link=all start=none', 0)).style).toBe('dashed');
    expect((await bracketStyle('link=all start=both', 0)).style).toBe('solid');
    expect((await bracketStyle('link=pairs start=horizontal', 0)).style).toBe('dashed');
    expect((await bracketStyle('link=pairs start=horizontal', 1)).style).toBe('solid');
    // The bends are rounder than the smallest radius.
    expect((await bracketStyle('link=pairs start=both', 0)).radius).toBeGreaterThan(2);

    // Every toggle has the same geometry; a linked one is a coloured glyph on no background.
    const toggles = matrixCell(page, 'link=pairs start=horizontal').getByRole('button');
    const look = (index: number) =>
      toggles.nth(index).evaluate((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          background: style.backgroundColor,
          color: style.color,
          width: box.width,
          height: box.height,
        };
      });
    const unlinked = await look(0);
    const linked = await look(1);
    expect(linked.background).toBe('rgba(0, 0, 0, 0)');
    expect(unlinked.background).toBe('rgba(0, 0, 0, 0)');
    expect(linked.color).not.toBe(unlinked.color);
    expect([linked.width, linked.height]).toEqual([unlinked.width, unlinked.height]);
    await toggles.nth(1).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(toggles.nth(1)).toHaveAttribute('data-focus-visible', 'true');
    await lab.expectAccessible();
  });
});
