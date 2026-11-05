import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

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

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.6 keeps the unit level with the inputs, link brackets or not', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    {
      const rows = page.locator(
        '.ui-four-side-property-strip > .ui-property-row__control:has(> .ui-property-row__unit)',
      );
      expect(await rows.count()).toBeGreaterThan(4);
      const offsets = await rows.evaluateAll((controls) =>
        controls.map((control) => {
          const unit = control.querySelector(':scope > .ui-property-row__unit');
          const input = control.querySelector('.ui-four-side-property-strip__side > input');
          const strip = control.querySelector('.ui-property-strip');
          if (!unit || !input || !strip) return { id: 'missing', offset: Infinity, below: true };
          const range = document.createRange();
          range.selectNodeContents(unit);
          const text = range.getBoundingClientRect();
          const box = input.getBoundingClientRect();
          const brackets = [...strip.querySelectorAll('.ui-four-side-property-strip__bracket')];
          return {
            id: `${input.getAttribute('aria-label')} ${unit.textContent}`,
            // The unit's text centred on the input row, whatever sits below it.
            offset: Math.abs(text.top + text.height / 2 - (box.top + box.height / 2)),
            // Brackets stay below the inputs.
            below: brackets.every(
              (bracket) => bracket.getBoundingClientRect().top >= box.bottom - 0.5,
            ),
          };
        }),
      );
      expect(offsets.filter(({ offset }) => offset > 1)).toEqual([]);
      expect(offsets.filter(({ below }) => !below)).toEqual([]);
    }
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.7 centres or ends values in their boxes without clipping them', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    for (const align of ['default', 'start', 'center', 'end']) {
      for (const shape of ['physical pairs', 'logical all', 'right to left', 'narrow']) {
        const cell = matrixCell(page, `align=${align} shape=${shape}`);
        const inputs = cell.getByRole('textbox');
        await expect(inputs).toHaveCount(4);
        const measured = await inputs.evaluateAll((nodes) =>
          nodes.map((node) => {
            const input = node as HTMLInputElement;
            return {
              align: getComputedStyle(input).textAlign,
              clipped: input.scrollWidth > input.clientWidth,
            };
          }),
        );
        const expected = align === 'default' ? 'start' : align;
        for (const each of measured) {
          expect(each.align, `${align} ${shape}`).toBe(expected);
          expect(each.clipped, `${align} ${shape}`).toBe(false);
        }
      }
    }
    // Centring moves only the text: the box, its letter and the bracket keep their places.
    const box = (align: string) =>
      matrixCell(page, `align=${align} shape=physical pairs`)
        .getByRole('textbox', { name: `Offset ${align} physical pairs left` })
        .evaluate((node) => node.getBoundingClientRect().toJSON() as DOMRect);
    const plain = await box('default');
    const centred = await box('center');
    expect(centred.width).toBeCloseTo(plain.width, 0);
    expect(centred.left - plain.left).toBeCloseTo(0, 0);

    // Editing a centred, linked pair still sets both sides, and the caret follows the typing.
    const cell = matrixCell(page, 'align=center shape=physical pairs');
    const left = cell.getByRole('textbox', { name: 'Offset center physical pairs left' });
    await left.click();
    await page.keyboard.press('End');
    await page.keyboard.type('.5');
    await expect(left).toHaveValue('4.5');
    await expect(
      cell.getByRole('textbox', { name: 'Offset center physical pairs right' }),
    ).toHaveValue('4.5');
    expect(await left.evaluate((node) => (node as HTMLInputElement).selectionStart)).toBe(3);
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.8 shows a message across all four controls and clears it', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    for (const shape of ['one side', 'two sides', 'linked all', 'narrow', 'right to left']) {
      const strip = matrixCell(page, `shape=${shape}`).locator('.ui-four-side-property-strip');
      const geometry = await strip.evaluate((row) => {
        const box = (selector: string) =>
          [...row.querySelectorAll(selector)].map((element) => element.getBoundingClientRect());
        const inputs = box('.ui-four-side-property-strip__side > input');
        const [error] = box('.ui-four-side-property-strip__error');
        const brackets = box('.ui-four-side-property-strip__bracket');
        const lefts = inputs.map((input) => input.left);
        const rights = inputs.map((input) => input.right);
        return {
          error,
          start: Math.min(...lefts),
          end: Math.max(...rights),
          below: Math.max(...[...inputs, ...brackets].map((each) => each.bottom)),
        };
      });
      // The message starts at or before the first control and runs to the last one, below all.
      expect(geometry.error?.height, shape).toBeGreaterThan(0);
      expect(geometry.error?.left ?? Infinity, shape).toBeLessThanOrEqual(geometry.start + 0.5);
      expect(geometry.error?.right ?? 0, shape).toBeGreaterThanOrEqual(geometry.end - 0.5);
      expect(geometry.error?.top ?? 0, shape).toBeGreaterThanOrEqual(geometry.below - 0.5);
    }
    const two = matrixCell(page, 'shape=two sides');
    await expect(two.locator('.ui-four-side-property-strip__message')).toHaveText([
      'Enter a whole number from 0 to 999.',
      'Enter a value of 0 or more.',
    ]);
    const top = two.getByRole('textbox', { name: 'Spacing two sides top' });
    await expect(top).toHaveAttribute('aria-invalid', 'true');
    await top.fill('6');
    await expect(top).not.toHaveAttribute('aria-invalid');
    await expect(two.locator('.ui-four-side-property-strip__message')).toHaveText([
      'Enter a value of 0 or more.',
    ]);
    // Linked sides that share a message show it once; a fix clears them all and the row's height.
    const linked = matrixCell(page, 'shape=linked all');
    await expect(linked.locator('.ui-four-side-property-strip__message')).toHaveCount(1);
    const before = await linked.locator('.ui-four-side-property-strip').boundingBox();
    await linked.getByRole('textbox', { name: 'Spacing linked all left' }).fill('3');
    await expect(linked.locator('.ui-four-side-property-strip__message')).toHaveCount(0);
    const after = await linked.locator('.ui-four-side-property-strip').boundingBox();
    expect(after?.height ?? 0).toBeLessThan(before?.height ?? 0);
    await lab.expectAccessible();
  });
});

test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 reports linked edits to the page that owns the values', async ({
  page,
  lab,
}) => {
  await lab.open('four-side-property-strip');
  const pairs = page.locator('[data-lab-owned-strip="pairs"]');
  const pairSides = pairs.locator('[data-lab-output="sides pairs"]');
  await pairs.getByRole('textbox', { name: 'Border pairs top' }).fill('6');
  await expect(pairSides).toHaveText('top 6, bottom 6, left 8, right 8');
  await pairs.getByRole('textbox', { name: 'Border pairs left' }).fill('2');
  await expect(pairSides).toHaveText('top 6, bottom 6, left 2, right 8');
  await pairs.getByRole('button', { name: 'Link left and right' }).click();
  await expect(pairs.locator('[data-lab-output="linked pairs"]')).toHaveText(
    'vertical, horizontal',
  );
  await pairs.getByRole('textbox', { name: 'Border pairs right' }).fill('5');
  await expect(pairSides).toHaveText('top 6, bottom 6, left 5, right 5');
  await pairs.getByRole('button', { name: 'Reset the pairs border' }).click();
  await expect(pairSides).toHaveText('top 4, bottom 4, left 8, right 8');
  await expect(pairs.getByRole('textbox', { name: 'Border pairs top' })).toHaveValue('4');

  const all = page.locator('[data-lab-owned-strip="all"]');
  await all.getByRole('textbox', { name: 'Border all bottom' }).fill('3');
  await expect(all.locator('[data-lab-output="sides all"]')).toHaveText(
    'top 3, bottom 3, left 3, right 3',
  );
  await all.getByRole('button', { name: 'Link all sides' }).click();
  await expect(all.locator('[data-lab-output="linked all"]')).toHaveText('none');
  await all.getByRole('textbox', { name: 'Border all left' }).fill('9');
  await expect(all.locator('[data-lab-output="sides all"]')).toHaveText(
    'top 3, bottom 3, left 9, right 3',
  );
});

test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.2 shows the row description and a working action in a narrow panel', async ({
  page,
  lab,
}) => {
  await lab.open('four-side-property-strip');
  const demo = page.locator('[data-lab-described-strip]');
  await expect(demo.getByText('Space between the frame and its content.')).toBeVisible();
  const reset = demo.getByRole('button', { name: 'Reset inset' });
  await reset.click();
  for (const side of ['top', 'bottom', 'left', 'right'])
    await expect(demo.getByRole('textbox', { name: `Inset ${side}` })).toHaveValue('0');
  await expect(reset).toBeDisabled();
  expect(await demo.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await lab.expectAccessible('[data-lab-described-strip]');
});
