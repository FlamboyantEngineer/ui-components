import type { Page } from '@playwright/test';
import { controlHeight, expect, matrixCell, test } from './fixtures.js';

function load(page: Page) {
  return page.locator('[data-lab-field="unit-after"]');
}

test.describe('Number Field display choices', () => {
  test('UIC-NUMBER-FIELD-3.3 steps the value with the wheel over the double arrow', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const field = load(page);
    const input = field.getByRole('textbox', { name: 'Load' });
    const handle = field.locator('.ui-number-field__scrubber');
    await handle.scrollIntoViewIfNeeded();
    const scrolled = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    await handle.hover();
    await page.mouse.wheel(0, -100);
    await expect(input).toHaveValue('13');
    await expect(page.locator('[data-lab-output="Load"]')).toHaveText('13');
    await page.mouse.wheel(0, 100);
    await page.mouse.wheel(0, 100);
    await expect(input).toHaveValue('12');
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Shift');
    await expect(input).toHaveValue('22');
    await page.keyboard.down('Alt');
    await page.mouse.wheel(0, 100);
    await page.keyboard.up('Alt');
    await expect(input).toHaveValue('21.9');
    expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(scrolled);
    // A zoom gesture is the browser's: the value stays.
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');
    await expect(input).toHaveValue('21.9');
  });

  test('UIC-NUMBER-FIELD-3.1 sets the unit right after the number, while typing too', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const field = load(page);
    const input = field.getByRole('textbox', { name: 'Load' });
    const unit = field.locator('.ui-number-field__end');
    const gap = async () => {
      const [text, end] = await Promise.all([
        field.locator('.ui-number-field__sizer').boundingBox(),
        unit.boundingBox(),
      ]);
      return end && text ? end.x - (text.x + text.width) : Number.NaN;
    };
    expect(await gap()).toBeGreaterThanOrEqual(0);
    expect(await gap()).toBeLessThanOrEqual(6);
    const before = (await unit.boundingBox())?.x ?? 0;
    await input.fill('12345.5');
    expect((await unit.boundingBox())?.x ?? 0).toBeGreaterThan(before + 20);
    expect(await gap()).toBeLessThanOrEqual(6);
    // The input never clips its own text.
    expect(await input.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await input.press('Enter');
    await expect(input).toHaveValue('12,345.5');
    // At the edge, the unit sits at the frame's end.
    const edge = matrixCell(page, 'display=unit at edge size=md');
    const [group, edgeUnit] = await Promise.all([
      edge.locator('.ui-number-field__group').boundingBox(),
      edge.locator('.ui-number-field__end').boundingBox(),
    ]);
    const increment = await edge.locator('.ui-number-field__increment').boundingBox();
    expect(group && edgeUnit && increment).toBeTruthy();
    expect(
      Math.abs((edgeUnit?.x ?? 0) + (edgeUnit?.width ?? 0) - (increment?.x ?? 0)),
    ).toBeLessThanOrEqual(1);
  });

  test("UIC-NUMBER-FIELD-3.1 draws the unit in the number's type and on its baseline", async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const cells = page.locator('table[data-lab-matrix="quantity placement size"] td');
    await expect(cells).toHaveCount(40);
    const mismatches = await cells.evaluateAll((nodes) => {
      const centre = (rect: DOMRect) => rect.top + rect.height / 2;
      const textRect = (node: Element) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect();
      };
      const type = (node: Element) => {
        const style = getComputedStyle(node);
        return [
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.fontStyle,
          style.lineHeight,
          style.color,
          style.fontVariantNumeric,
        ].join('|');
      };
      return nodes.flatMap((cell) => {
        const id = cell.getAttribute('data-lab-cell') ?? '';
        const input = cell.querySelector('.ui-number-field__input');
        const unit = cell.querySelector('.ui-number-field__end');
        if (!input || !unit) return [`${id}: missing parts`];
        const problems: string[] = [];
        if (type(input) !== type(unit)) problems.push(`${id}: ${type(input)} vs ${type(unit)}`);
        // The input draws its text centred in its box, as the unit does: equal centres, one baseline.
        const offset = Math.abs(centre(input.getBoundingClientRect()) - centre(textRect(unit)));
        if (offset > 1) problems.push(`${id}: baseline off by ${offset}`);
        const sizer = cell.querySelector('.ui-number-field__sizer');
        if (sizer) {
          if (type(sizer).split('|')[1] !== type(input).split('|')[1])
            problems.push(`${id}: sizer`);
          // About a space between the number and the unit after it.
          const gap = textRect(unit).left - textRect(sizer).right;
          const space = Number.parseFloat(getComputedStyle(unit).fontSize) * 0.25;
          if (gap < space - 1 || gap > space + 1) problems.push(`${id}: gap ${gap}`);
        }
        return problems;
      });
    });
    expect(mismatches).toEqual([]);
    // German grouping reads with the unit too.
    await expect(
      page.locator('[data-lab-field="unit-locale"]').getByRole('textbox', { name: 'Gewicht' }),
    ).toHaveValue('1.234,5');
  });

  for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
    test(`UIC-NUMBER-FIELD-3.3 draws every display choice at ${size}`, async ({ page, lab }) => {
      await lab.open('number-field');
      const height = await controlHeight(page, size);
      for (const display of ['steppers', 'double arrow', 'unit at edge', 'unit after value']) {
        const cell = matrixCell(page, `display=${display} size=${size}`);
        const group = cell.locator('.ui-number-field__group');
        expect(Math.round((await group.boundingBox())?.height ?? 0), display).toBe(height);
        // Every part fits inside the frame.
        const frame = await group.boundingBox();
        for (const part of await cell
          .locator('.ui-number-field__group > *, .ui-number-field__group .ui-glyph')
          .all()) {
          const box = await part.boundingBox();
          if (!box || !frame) continue;
          expect(box.y, display).toBeGreaterThanOrEqual(frame.y - 0.5);
          expect(box.y + box.height, display).toBeLessThanOrEqual(frame.y + frame.height + 0.5);
        }
      }
    });
  }
});

test.describe('Number Field typed units', () => {
  test('UIC-NUMBER-FIELD-3.4 commits decimal commas without grouping', async ({ page, lab }) => {
    await lab.open('number-field');
    const input = page.getByRole('spinbutton', { name: 'Decimal length' });
    await input.fill('1,5');
    await input.press('Enter');
    await expect(input).toHaveValue('1,5');
    await expect(input).toHaveAttribute('aria-valuenow', '1.5');
    await expect(page.locator('[data-lab-output="Decimal length committed"]')).toHaveText('1.5');
  });

  for (const action of ['Enter', 'Tab', 'pointer blur']) {
    test(`UIC-NUMBER-FIELD-3.4 keeps untouched accounting amounts negative on ${action}`, async ({
      page,
      lab,
    }) => {
      await lab.open('number-field');
      const input = page.getByRole('spinbutton', { name: 'Accounting amount' });
      await expect(input).toHaveValue('($1.00)');
      await input.focus();
      if (action === 'pointer blur') {
        const outside = page.getByRole('button', { name: 'Leave accounting amount' });
        await outside.scrollIntoViewIfNeeded();
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        await outside.click();
      } else {
        await input.press(action);
        if (action === 'Tab') {
          for (
            let i = 0;
            i < 4 &&
            !(await page
              .getByRole('button', { name: 'Leave accounting amount' })
              .evaluate((node) => node === document.activeElement));
            i++
          )
            await page.keyboard.press('Tab');
          await expect(page.getByRole('button', { name: 'Leave accounting amount' })).toBeFocused();
        }
      }
      await expect(input).toHaveValue('($1.00)');
      await expect(input).toHaveAttribute('aria-valuenow', '-1');
      await expect(input).not.toHaveAttribute('aria-invalid');
      await expect(page.locator('[data-lab-output="Accounting amount committed"]')).toHaveText(
        '-1',
      );
    });
  }

  test('UIC-NUMBER-FIELD-3.4 writes a compact quantity in standard notation and refuses 12K', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const field = page.locator('[data-lab-field="units-compact"]');
    const input = field.getByRole('spinbutton', { name: 'Compact length' });
    await expect(input).toHaveValue('12,000');
    await input.fill('12K');
    await input.press('Enter');
    await expect(input).toHaveValue('12K');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-valuenow', '12000');
  });

  test('UIC-NUMBER-FIELD-3.4 reads back Arabic scientific exponents', async ({ page, lab }) => {
    await lab.open('number-field');
    const field = page.locator('[data-lab-field="units-arabic-scientific"]');
    const input = field.getByRole('spinbutton', { name: 'Arabic scientific length' });
    await expect(input).toHaveValue('١٫٢أس٤');
    await input.focus();
    await input.press('Enter');
    await expect(input).not.toHaveAttribute('aria-invalid');
    await expect(input).toHaveAttribute('aria-valuenow', '12000');
    await input.fill('٢٫٥أس-٣');
    await input.press('Enter');
    await expect(input).toHaveAttribute('aria-valuenow', '0.0025');
    await expect(input).not.toHaveAttribute('aria-invalid');
  });

  test('UIC-NUMBER-FIELD-3.4 keeps a precise value behind its rounded display', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const input = page.getByRole('spinbutton', { name: 'Precise length' });
    const output = page.locator('[data-lab-output="Precise length value"]');
    await expect(input).toHaveValue('1.235');
    await input.focus();
    await input.press('Enter');
    await input.press('Tab');
    await expect(output).toHaveText('1.23456');
    await expect(input).toHaveAttribute('aria-valuenow', '1.23456');
    await input.fill('2.5');
    await input.press('Enter');
    await expect(output).toHaveText('2.5');
  });

  test('UIC-NUMBER-FIELD-3.4 converts 5cm to 50 mm, keeps a wrong unit and restores', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const field = page.locator('[data-lab-field="units"]');
    const input = field.getByRole('spinbutton', { name: 'Length' });
    await expect(input).toHaveValue('120');
    await expect(field.locator('.ui-number-field__end')).toHaveText('mm');
    await input.fill('5cm');
    await input.press('Enter');
    await expect(input).toHaveValue('50');
    await expect(input).toHaveAttribute('aria-valuetext', '50 mm');
    await expect(page.locator('[data-lab-output="Length committed"]')).toHaveText('50');
    // The unit follows the converted number.
    const [sizer, unit] = await Promise.all([
      field.locator('.ui-number-field__sizer').boundingBox(),
      field.locator('.ui-number-field__end').boundingBox(),
    ]);
    expect((unit?.x ?? 0) - ((sizer?.x ?? 0) + (sizer?.width ?? 0))).toBeLessThanOrEqual(6);
    await input.fill('3 parsecs');
    await input.press('Enter');
    await expect(input).toHaveValue('3 parsecs');
    await expect(field.locator('.ui-field__message')).toHaveText(
      'Enter a number in mm, cm, m, or in.',
    );
    await input.fill('');
    await input.focus();
    await page.keyboard.insertText('2 in');
    await input.press('Enter');
    await expect(input).toHaveValue('50.8');
    await expect(field.locator('.ui-field__message')).toHaveText('');
    await field.getByRole('button', { name: /Restore/ }).click();
    await expect(input).toHaveValue('120');
    await lab.expectAccessible();
  });
});
