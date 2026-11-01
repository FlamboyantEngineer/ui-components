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

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 links opposite sides or all four from the toggle', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const pairs = matrixCell(page, 'link=pairs start=unlinked');
    const side = (area: typeof pairs, link: string, name: string) =>
      area.getByRole('textbox', {
        name: `Padding ${link} ${link === 'all' ? 'linked' : 'unlinked'} ${name}`,
      });
    const toggle = pairs.getByRole('button', { name: 'Link opposite sides' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(pairs.locator('.ui-four-side-property-strip')).toHaveAttribute(
      'data-linked',
      'true',
    );
    await side(pairs, 'pairs', 'left').fill('20');
    await expect(side(pairs, 'pairs', 'right')).toHaveValue('20');
    await expect(side(pairs, 'pairs', 'top')).toHaveValue('8');

    const all = matrixCell(page, 'link=all start=linked');
    await side(all, 'all', 'bottom').fill('6');
    for (const name of ['top', 'left', 'right']) {
      await expect(side(all, 'all', name)).toHaveValue('6');
    }
    await lab.expectAccessible();
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
    await check('link=pairs start=linked', 'Padding pairs linked', [
      ['top', 'bottom'],
      ['left', 'right'],
    ]);
    await check('link=all start=unlinked', 'Padding all unlinked', [
      ['top', 'bottom', 'left', 'right'],
    ]);
    await check('link=pairs direction=rtl', 'Inset pairs rtl', [
      ['block-start', 'block-end'],
      ['inline-start', 'inline-end'],
    ]);
    await check('link=all direction=rtl', 'Inset all rtl', [
      ['block-start', 'block-end', 'inline-start', 'inline-end'],
    ]);
    // Unlinked rules are dashed; linked ones solid.
    const style = (cell: string) =>
      matrixCell(page, cell)
        .locator('.ui-four-side-property-strip__bracket')
        .first()
        .evaluate((node) => getComputedStyle(node, '::before').borderBottomStyle);
    expect(await style('link=all start=unlinked')).toBe('dashed');
    expect(await style('link=all start=linked')).toBe('solid');
    await lab.expectAccessible();
  });
});
