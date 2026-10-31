import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Segmented Choice lab', () => {
  test('UIC-SEGMENTED-CHOICE-1.3 draws three heights and shares or hugs the width', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    for (const [size, height] of [
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const frame = page.locator(
        `${cellSelector(`sizing=equal size=${size}`)} .ui-segmented-choice`,
      );
      expect((await frame.boundingBox())?.height).toBe(height);
    }
    const equal = matrixCell(page, 'sizing=equal size=md');
    const widths = await equal
      .locator('.ui-segmented-choice__segment')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    expect((await equal.locator('.ui-segmented-choice').boundingBox())?.width).toBe(280);
    const content = matrixCell(page, 'sizing=content size=md').locator('.ui-segmented-choice');
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

  test('UIC-SEGMENTED-CHOICE-1.6 moves the selection indicator into the picked segment', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const group = page.getByRole('radiogroup', { name: 'View, equal, md' });
    const week = group.getByRole('radio', { name: 'Week' });
    const month = group.getByRole('radio', { name: 'Month' });
    await expect(week.locator('.ui-segmented-choice__indicator')).toHaveCount(1);
    await month.click();
    await expect(month.locator('.ui-segmented-choice__indicator')).toHaveCount(1);
    await expect(week.locator('.ui-segmented-choice__indicator')).toHaveCount(0);
    // Once the slide settles the indicator covers the segment inside its 1px separator border.
    await expect(async () => {
      const indicator = await month.locator('.ui-segmented-choice__indicator').boundingBox();
      const segment = await month.boundingBox();
      expect(Math.abs((indicator?.x ?? 0) - (segment?.x ?? 0))).toBeLessThanOrEqual(1.5);
      expect(Math.abs((indicator?.width ?? 0) - (segment?.width ?? 0))).toBeLessThanOrEqual(1.5);
    }).toPass();
    await lab.expectAccessible();
  });

  test('UIC-SEGMENTED-CHOICE-1.7 names icon-only segments and shows their labels in tooltips', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const group = page.getByRole('radiogroup', { name: 'Zoom, md' });
    await expect(group).toHaveAttribute('data-icon-only', 'true');
    const width = group.getByRole('radio', { name: 'Fit width' });
    await expect(width.locator('.ui-segmented-choice__label')).toHaveCount(0);
    await page.getByRole('radiogroup', { name: 'Zoom, sm' }).getByRole('radio').first().focus();
    await page.keyboard.press('Tab');
    await expect(width).toBeFocused();
    await expect(
      page.locator('.ui-tooltip:not([data-exiting])', { hasText: 'Fit width' }),
    ).toBeVisible();
    await expect(width).toHaveAccessibleDescription('');
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('radio', { name: 'Fit page' })).toBeFocused();
    await expect(
      page.locator('.ui-tooltip:not([data-exiting])', { hasText: 'Fit page' }),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-SEGMENTED-CHOICE-1.7 keeps focus on a segment as icons-only switches', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const demo = page.locator('[data-lab-case="compact-toggle"]');
    const width = demo.getByRole('radio', { name: 'Fit width' });
    await width.focus();
    const toggle = demo.getByRole('checkbox', { name: 'Icons only' });
    // A click that does not take focus, as a responsive layout change would not.
    await toggle.dispatchEvent('click');
    await expect(demo.locator('.ui-segmented-choice')).toHaveAttribute('data-icon-only', 'true');
    await expect(width).toBeFocused();
    await expect(width).not.toContainText('Fit width');
    await expect(demo.getByRole('radio', { name: 'Actual size' })).toContainText('Actual size');
    await toggle.dispatchEvent('click');
    await expect(width).toBeFocused();
    await expect(width).toContainText('Fit width');
    await lab.expectAccessible();
  });

  test('UIC-SEGMENTED-CHOICE-2.4 UIC-SEGMENTED-CHOICE-2.5 presses toggles independently and submits them', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const toolbar = page.getByRole('toolbar', { name: 'Text style, default' });
    await expect(toolbar).toHaveAttribute('data-selection-mode', 'multiple');
    const bold = toolbar.getByRole('button', { name: 'Bold' });
    const italic = toolbar.getByRole('button', { name: 'Italic' });
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await bold.focus();
    await page.keyboard.press('ArrowRight');
    await expect(italic).toBeFocused();
    await page.keyboard.press('Space');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await expect(bold).toHaveAttribute('aria-pressed', 'true');

    const form = page.locator('[data-lab-demo="form"]');
    await form.getByRole('radio', { name: 'Month' }).click();
    await form.getByRole('button', { name: 'Italic' }).click();
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(form.locator('[data-lab-output="submitted"]')).toHaveText(
      'Submitted: view=month style=bold,italic',
    );
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(form.getByRole('radio', { name: 'Week' })).toBeChecked();
    await expect(form.getByRole('button', { name: 'Italic' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(form.locator('[data-lab-output="submitted"]')).toHaveText(
      'Submitted: view=week style=bold',
    );
    await form.getByRole('radio', { name: 'Day' }).click();
    await form.evaluate((element: HTMLFormElement) => {
      element.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      element.reset();
    });
    await page.waitForTimeout(100);
    await expect(form.getByRole('radio', { name: 'Day' })).toBeChecked();
    await form.evaluate((element: HTMLFormElement) => element.reset());
    await expect(form.getByRole('radio', { name: 'Week' })).toBeChecked();
    await lab.expectAccessible();
  });

  test('UIC-SEGMENTED-CHOICE-1.9 draws counts after the labels and reads them in the names', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const group = page.getByRole('radiogroup', { name: 'Notes, labels, md' });
    const resolved = group.getByRole('radio', { name: 'Resolved, 99+' });
    const count = resolved.locator('.ui-segmented-choice__count');
    await expect(count).toHaveText('99+');
    const label = await resolved.locator('.ui-segmented-choice__label').boundingBox();
    expect((await count.boundingBox())?.x).toBeGreaterThan((label?.x ?? 0) + (label?.width ?? 0));
    const icons = page.getByRole('radiogroup', { name: 'Notes, icons, md' });
    await expect(icons.getByRole('radio', { name: 'Open, 3' })).toBeVisible();
    await lab.expectAccessible('[data-lab-section="Counts"]');
  });

  test('UIC-SEGMENTED-CHOICE-2.6 holds a pick pending while it saves and reverts a failed save', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('segmented-choice');
    const demo = page.locator('[data-lab-demo="saved"]');
    const group = demo.getByRole('radiogroup', { name: 'Notes to show' });
    const resolved = group.getByRole('radio', { name: 'Resolved, 99+' });
    await resolved.click();
    await expect(resolved).toHaveAttribute('aria-checked', 'true');
    await expect(group).toHaveAttribute('data-pending', 'true');
    await expect(group).toHaveAttribute('aria-busy', 'true');
    await page.clock.runFor(800);
    await expect(group).not.toHaveAttribute('data-pending');
    await expect(demo.locator('[data-lab-output="saved"]')).toHaveText('Saved: resolved');

    await demo.getByText('Fail the next save').click();
    await group.getByRole('radio', { name: 'All, 99+' }).click();
    await expect(group.getByRole('radio', { name: 'All, 99+' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.clock.runFor(800);
    await expect(resolved).toHaveAttribute('aria-checked', 'true');
    await expect(demo.getByRole('alert')).toContainText('could not be saved');
    await expect(demo.locator('[data-lab-output="saved"]')).toHaveText('Saved: resolved');
    await lab.expectAccessible('[data-lab-demo="saved"]');
  });
});
