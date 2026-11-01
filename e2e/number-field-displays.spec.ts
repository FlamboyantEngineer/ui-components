import type { Page } from '@playwright/test';
import { expect, test, matrixCell, controlHeight } from './fixtures.js';

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
