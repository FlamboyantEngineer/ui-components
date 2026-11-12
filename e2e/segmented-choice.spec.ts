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
    // A focus that scrolls the page closes the tooltip it opens (React Aria closes tooltips on
    // scroll), so bring the group into view before tabbing to it.
    await group.scrollIntoViewIfNeeded();
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
    const resolved = group.getByRole('radio', { name: 'Resolved, 128' });
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
    const resolved = group.getByRole('radio', { name: 'Resolved, 128' });
    await resolved.click();
    await expect(resolved).toHaveAttribute('aria-checked', 'true');
    await expect(group).toHaveAttribute('data-pending', 'true');
    await expect(group).toHaveAttribute('aria-busy', 'true');
    await page.clock.runFor(800);
    await expect(group).not.toHaveAttribute('data-pending');
    await expect(demo.locator('[data-lab-output="saved"]')).toHaveText('Saved: resolved');

    await demo.getByText('Fail the next save').click();
    await group.getByRole('radio', { name: 'All, 131' }).click();
    await expect(group.getByRole('radio', { name: 'All, 131' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.clock.runFor(800);
    await expect(resolved).toHaveAttribute('aria-checked', 'true');
    await expect(demo.getByRole('alert')).toContainText('could not be saved');
    await expect(demo.locator('[data-lab-output="saved"]')).toHaveText('Saved: resolved');
    await lab.expectAccessible('[data-lab-demo="saved"]');
  });
  test('UIC-SEGMENTED-CHOICE-1.9 grows a count badge with its digits at one height', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-choice');
    const sizes = ['xs', 'sm', 'md', 'lg'];
    for (const size of sizes) {
      const group = page.getByRole('radiogroup', { name: `Count widths, ${size}` });
      const counts = group.locator('.ui-segmented-choice__count');
      const boxes = await counts.evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            clipped: element.scrollWidth > element.clientWidth,
          };
        }),
      );
      const [nine, ten, many, thousand] = boxes;
      expect(nine?.width).toBeCloseTo(nine?.height ?? 0, 0);
      expect(boxes.every((box) => Math.abs(box.height - (nine?.height ?? 0)) < 0.5)).toBe(true);
      expect(ten?.width).toBeGreaterThan(nine?.width ?? 0);
      expect(many?.width).toBeCloseTo(ten?.width ?? 0, 0);
      expect(thousand?.width).toBeGreaterThan(many?.width ?? 0);
      expect(boxes.some((box) => box.clipped)).toBe(false);
      await expect(counts).toHaveText(['9', '10', '99', '1,000']);
    }
    const capped = page.getByRole('radiogroup', { name: 'Capped count' });
    await expect(capped.locator('.ui-segmented-choice__count')).toHaveText('99+');
  });
});

test('UIC-SEGMENTED-CHOICE-1.3 keeps descenders and accents whole in labels and counts at every size', async ({
  page,
  lab,
}) => {
  await lab.open('segmented-choice');
  const heights = { xs: 20, sm: 24, md: 28, lg: 32 } as const;
  for (const [segments, size] of (['content', 'equal'] as const).flatMap((segments) =>
    (['xs', 'sm', 'md', 'lg'] as const).map((size) => [segments, size] as const),
  )) {
    const group = page.locator(`[data-lab-glyphs="${segments}-${size}"]`);
    await group.scrollIntoViewIfNeeded();
    const frame = await group.boundingBox();
    if (!frame) throw new Error('The group has no layout box.');
    expect(frame.height, `${segments} ${size}`).toBe(heights[size]);
    const clip = { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
    const unclip = (overflow: string) =>
      group.evaluate((node, value) => {
        const parts = node.querySelectorAll<HTMLElement>(
          '.ui-segmented-choice__label, .ui-segmented-choice__count',
        );
        parts.forEach((part) => (part.style.overflow = value));
      }, overflow);
    const clipped = (await page.screenshot({ clip })).toString('base64');
    await unclip('visible');
    const whole = (await page.screenshot({ clip })).toString('base64');
    await unclip('');
    // Inside the frame, away from its rounded corners, the drawing is the same with nothing clipped.
    const changed = await page.evaluate(
      async ({ first, second }) => {
        const read = async (data: string) => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('No canvas context.');
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height);
        };
        const [a, b] = [await read(first), await read(second)];
        let count = 0;
        for (let y = 0; y < a.height; y += 1) {
          for (let x = 8; x < a.width - 8; x += 1) {
            const at = (y * a.width + x) * 4;
            if ([0, 1, 2].some((channel) => a.data[at + channel] !== b.data[at + channel]))
              count += 1;
          }
        }
        return count;
      },
      { first: clipped, second: whole },
    );
    expect(changed, `${segments} ${size}`).toBe(0);
  }
});

test('UIC-SEGMENTED-CHOICE-1.3 shows every label and count in full in the equal Glyph room samples', async ({
  page,
  lab,
}) => {
  await lab.open('segmented-choice');
  const measure = (size: string) =>
    page.locator(`[data-lab-glyphs="equal-${size}"]`).evaluate((group) => {
      const frame = group.getBoundingClientRect();
      return [...group.querySelectorAll<HTMLElement>('.ui-segmented-choice__segment')].map(
        (segment) => {
          const box = segment.getBoundingClientRect();
          const label = segment.querySelector<HTMLElement>('.ui-segmented-choice__label');
          const count = segment.querySelector<HTMLElement>('.ui-segmented-choice__count');
          const badge = count?.getBoundingClientRect();
          const labelBox = label?.getBoundingClientRect();
          return {
            width: Math.round(box.width * 100) / 100,
            text: label?.textContent,
            cut: !label || label.scrollWidth > label.clientWidth,
            count: count?.textContent,
            badgeInside:
              !!badge &&
              badge.left >= box.left - 0.5 &&
              badge.right <= box.right + 0.5 &&
              badge.top >= frame.top - 0.5 &&
              badge.bottom <= frame.bottom + 0.5 &&
              (!labelBox || badge.left >= labelBox.right - 0.5),
          };
        },
      );
    });
  for (const size of ['xs', 'sm', 'md', 'lg']) {
    const group = page.locator(`[data-lab-glyphs="equal-${size}"]`);
    await group.scrollIntoViewIfNeeded();
    const before = await measure(size);
    expect(before.map(({ text }) => text)).toEqual(['Typography', 'Quietly gjpqy', 'Émigré Åçñ']);
    expect(before.map(({ count }) => count)).toEqual(['7', '42', '99+']);
    expect(
      before.filter(({ cut }) => cut),
      size,
    ).toEqual([]);
    expect(
      before.every(({ badgeInside }) => badgeInside),
      size,
    ).toBe(true);
    expect(new Set(before.map(({ width }) => width)).size, size).toBe(1);
    // Selecting another segment changes no width and cuts nothing.
    await group.getByRole('radio', { name: /Émigré/ }).click({ force: true });
    await expect(group.getByRole('radio', { name: /Émigré/ })).toBeChecked();
    expect(await measure(size)).toEqual(before);
  }
  // The deliberately narrow row still ends a long label in an ellipsis.
  const narrow = page.locator('[data-lab-glyphs="narrow-md"] .ui-segmented-choice__label');
  expect(
    await narrow.evaluateAll((labels) =>
      labels.some((label) => label.scrollWidth > label.clientWidth),
    ),
  ).toBe(true);
  // The samples fit the page without scrolling it sideways.
  const tables = page.locator('[data-lab-section="Glyph room"] table');
  await expect(tables).toHaveCount(2);
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  for (const table of await tables.all()) {
    const box = await table.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? Infinity)).toBeLessThanOrEqual(width);
  }
});

test('UIC-SEGMENTED-CHOICE-1.3 gives equal segments the widest label in a content-sized row', async ({
  page,
  lab,
}) => {
  await lab.open('condition-builder');
  const combinators = page.locator('.ui-condition-builder__combinator');
  expect(await combinators.count()).toBeGreaterThan(1);
  for (const combinator of await combinators.all()) {
    const labels = await combinator.evaluate((node) =>
      [...node.querySelectorAll<HTMLElement>('.ui-segmented-choice__label')].map((label) => ({
        text: label.textContent,
        cut: label.scrollWidth > label.clientWidth || label.scrollHeight > label.clientHeight,
        width: label.closest('.ui-segmented-choice__segment')?.getBoundingClientRect().width,
      })),
    );
    expect(labels.map(({ text }) => text)).toEqual(['All', 'Any']);
    expect(labels.filter(({ cut }) => cut)).toEqual([]);
    expect(labels[0]?.width).toBe(labels[1]?.width);
  }
});
