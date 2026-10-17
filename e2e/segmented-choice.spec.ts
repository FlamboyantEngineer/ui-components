import { expect, test } from './fixtures.js';

test.describe('Segmented Choice lab', () => {
  test('UIC-SEGMENTED-CHOICE-1.3 draws three segment heights and shares or hugs the width', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    for (const [size, height] of [
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const segment = page
        .locator(`[data-lab-cell="sizing=equal size=${size}"] .ui-segmented-choice__segment`)
        .first();
      expect((await segment.boundingBox())?.height).toBe(height);
    }
    const equal = page.locator('[data-lab-cell="sizing=equal size=md"]');
    const widths = await equal
      .locator('.ui-segmented-choice__segment')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    expect((await equal.locator('.ui-segmented-choice').boundingBox())?.width).toBe(280);
    const content = page.locator('[data-lab-cell="sizing=content size=md"] .ui-segmented-choice');
    expect((await content.boundingBox())?.width).toBeLessThan(280);

    const day = content.getByRole('radio', { name: 'Day' });
    const before = (await day.boundingBox())?.width;
    await day.click();
    await expect(day).toHaveAttribute('aria-checked', 'true');
    expect((await day.boundingBox())?.width).toBe(before);
  });

  test('UIC-SEGMENTED-CHOICE-2.1 UIC-SEGMENTED-CHOICE-3.4 moves focus with arrows and picks with Space', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const group = page.getByRole('radiogroup', { name: 'View, horizontal, default' });
    const day = group.getByRole('radio', { name: 'Day' });
    const week = group.getByRole('radio', { name: 'Week' });
    const month = group.getByRole('radio', { name: 'Month' });
    await day.focus();
    await page.keyboard.press('ArrowRight');
    await expect(week).toBeFocused();
    await expect(week).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(month).toBeFocused();
    await expect(month).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Space');
    await expect(month).toHaveAttribute('aria-checked', 'true');
    await expect(week).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Tab');
    expect(await group.evaluate((node) => node.contains(document.activeElement))).toBe(false);
    await month.hover();
    await expect(month).toHaveAttribute('data-hovered', 'true');
  });

  test('UIC-SEGMENTED-CHOICE-1.4 UIC-SEGMENTED-CHOICE-3.1 stacks vertical segments and skips disabled ones', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const vertical = page.getByRole('radiogroup', { name: 'View, vertical, default' });
    const boxes = await vertical
      .getByRole('radio')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
    expect(boxes[1]).toBeGreaterThan(boxes[0] ?? 0);
    expect(boxes[2]).toBeGreaterThan(boxes[1] ?? 0);
    await vertical.getByRole('radio', { name: 'Day' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(vertical.getByRole('radio', { name: 'Week' })).toBeFocused();

    const partly = page.getByRole('radiogroup', { name: 'View, horizontal, item disabled' });
    await expect(partly.getByRole('radio', { name: 'Month' })).toBeDisabled();
    await partly.getByRole('radio', { name: 'Week' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(partly.getByRole('radio', { name: 'Week' })).toBeFocused();

    const disabled = page.getByRole('radiogroup', { name: 'View, horizontal, disabled' });
    for (const segment of await disabled.getByRole('radio').all()) {
      await expect(segment).toBeDisabled();
    }
  });

  test('UIC-SEGMENTED-CHOICE-2.2 overrides an inherited value and clears back to it', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const demo = page.locator('[data-lab-demo="inherited"]');
    const group = demo.getByRole('radiogroup', { name: 'Calendar view' });
    const output = demo.locator('[data-lab-output]');
    await expect(group).toHaveAttribute('data-inherited', 'true');
    await expect(output).toHaveText('Week, inherited from the calendar default');
    await group.getByRole('radio', { name: 'Month' }).click();
    await expect(group).not.toHaveAttribute('data-inherited');
    await expect(output).toHaveText('Month, set here (pick it again to inherit)');
    await group.getByRole('radio', { name: 'Month' }).click();
    await expect(output).toHaveText('Week, inherited from the calendar default');
    await group.getByRole('radio', { name: 'Week' }).click();
    await expect(output).toHaveText('Week, set here (pick it again to inherit)');
    await lab.expectAccessible();
  });
});
